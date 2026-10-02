package kr.savien.Praesidium.service

import kr.savien.Praesidium.domain.Meeting
import kr.savien.Praesidium.dto.MonthlyReportActivityItem
import kr.savien.Praesidium.dto.MonthlyReportActivitySection
import kr.savien.Praesidium.dto.MonthlyReportResponse
import kr.savien.Praesidium.repository.ActivityCountRepository
import kr.savien.Praesidium.repository.ActivityTypeRepository
import kr.savien.Praesidium.repository.AttendanceRepository
import kr.savien.Praesidium.repository.FinanceRepository
import kr.savien.Praesidium.repository.MeetingRepository
import kr.savien.Praesidium.repository.MemberRepository
import kr.savien.Praesidium.repository.OfficerTermRepository
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import org.springframework.web.server.ResponseStatusException
import java.time.LocalDate

@Service
@Transactional(readOnly = true)
class MonthlyReportService(
    private val meetingRepository: MeetingRepository,
    private val memberRepository: MemberRepository,
    private val officerTermRepository: OfficerTermRepository,
    private val attendanceRepository: AttendanceRepository,
    private val financeRepository: FinanceRepository,
    private val activityCountRepository: ActivityCountRepository,
    private val activityTypeRepository: ActivityTypeRepository
) {

    companion object {
        private const val INCOME = "INCOME"
        private const val EXPENSE = "EXPENSE"
        private const val CARRY_OVER_NAME = "지지난주 비밀헌금"
        private const val INCOME_NAME = "지난주 비밀헌금"
        private const val DONATION_NAME = "의연금"
        private const val FLOWER_NAME = "꽃값"

        /** 주요활동내역 - 기도 및 신심행위: (표시 라벨, 활동유형 정식명) 순서쌍 */
        private val PRAYER_ACTIVITY_LABELS = listOf(
            "1. 묵주기도 7천만 단 바치기" to "묵주기도",
            "2. 평일미사 참례" to "평일미사참례",
            "3. 성경읽기, 쓰기" to "성경읽기/쓰기",
            "4. 매일미사 읽고, 묵상" to "매일미사 읽고 묵상하기",
            "5. 성모님의 군단 읽기" to "월간 성모님의 군단 읽기"
        )

        /** 주요활동내역 - 중점활동: (표시 라벨, 활동유형 정식명) 순서쌍 */
        private val FOCUS_ACTIVITY_LABELS = listOf(
            "1-1. 새 가족찾기(예비자 교리반 입교)" to "새 가족 찾기",
            "1-2. 쉬는교우 회두 (고해성사 및 신부님 면담)" to "쉬는 교우 회두권면",
            "2-1. 복지시설" to "사랑의 증언활동 - 복지시설",
            "2-2. 병원, 요양원" to "사랑의 증언활동 - 병원, 요양원",
            "2-3. 기타(독거노인 등 소외된 이웃돌봄)" to "사랑의 증언활동 - 기타",
            "3. 한반도 평화를 위한 밤 9시 주모경 바치기" to "한반도 평화를 위한 밤 9시 주모경 바치기",
            "4. 행동단원, 협조단원 모집 및 돌봄 활동" to "협조단원 모집 및 돌봄",
            "5. 일상기도" to "일상기도"
        )
    }

    /** 회차 날짜들을 기준으로 선택 가능한 "yyyy-MM" 목록을 최신순으로 반환한다. */
    fun availableMonths(): List<String> {
        return meetingRepository.findAll()
            .mapNotNull { parseFlexibleDate(it.meetingDate) }
            .map { "%04d-%02d".format(it.year, it.monthValue) }
            .distinct()
            .sortedDescending()
    }

    fun report(yearMonth: String): MonthlyReportResponse {
        if (!yearMonth.matches(Regex("\\d{4}-\\d{2}"))) {
            throw ResponseStatusException(HttpStatus.BAD_REQUEST, "년-월 형식이 올바르지 않습니다. (yearMonth=$yearMonth)")
        }

        val meetingsInMonth = meetingRepository.findAll()
            .filter { meeting ->
                val date = parseFlexibleDate(meeting.meetingDate)
                date != null && "%04d-%02d".format(date.year, date.monthValue) == yearMonth
            }
            .sortedWith(
                compareBy<Meeting> { parseFlexibleDate(it.meetingDate) ?: LocalDate.MIN }
                    .thenBy { it.sequence ?: 0 }
            )

        if (meetingsInMonth.isEmpty()) {
            return MonthlyReportResponse(
                yearMonth = yearMonth,
                meetingRangeLabel = "등록된 회차가 없습니다.",
                officerPresent = 0,
                officerTotal = 0,
                memberPresent = 0,
                memberTotal = 0,
                carryOverAmount = 0,
                incomeTotal = 0,
                expenseTotal = 0,
                balance = 0,
                donationTotal = 0,
                flowerTotal = 0,
                otherExpenseTotal = 0,
                activitySections = buildActivitySections(emptyList())
            )
        }

        val rangeLabel = buildRangeLabel(meetingsInMonth.first(), meetingsInMonth.last())

        val allOfficerTerms = officerTermRepository.findAllWithDetails()
        val allMembers = memberRepository.findAllByOrderByNameAsc()

        var officerPresent = 0
        var officerTotal = 0
        var memberPresent = 0
        var memberTotal = 0

        meetingsInMonth.forEach { meeting ->
            val meetingDate = parseFlexibleDate(meeting.meetingDate)

            val officerMemberIds = allOfficerTerms
                .filter { term -> term.position.officer == 1 && isTermActiveOn(term.startedOn, term.endedOn, meetingDate) }
                .map { it.member.id }
                .toSet()

            val membersAtMeeting = allMembers.filter { member ->
                isMemberOfMeetingDate(member.joinedOn, member.leftOn, meetingDate)
            }

            val presentMemberIds = attendanceRepository.findAllByMeetingId(meeting.id)
                .filter { it.status == "PRESENT" }
                .map { it.member.id }
                .toSet()

            val officers = membersAtMeeting.filter { it.id in officerMemberIds }
            val regulars = membersAtMeeting.filter { it.id !in officerMemberIds }

            officerTotal += officers.size
            officerPresent += officers.count { it.id in presentMemberIds }
            memberTotal += regulars.size
            memberPresent += regulars.count { it.id in presentMemberIds }
        }

        val financeItemsInRange = meetingsInMonth.flatMap { meeting ->
            financeRepository.findAllByMeeting_IdOrderByIdAsc(meeting.id)
        }

        val carryOverAmount = financeRepository
            .findAllByMeeting_IdOrderByIdAsc(meetingsInMonth.first().id)
            .filter { it.description == CARRY_OVER_NAME }
            .sumOf { it.amount.toLong() }

        val incomeTotal = financeItemsInRange
            .filter { it.kind == INCOME && it.description == INCOME_NAME }
            .sumOf { it.amount.toLong() }

        val expenseTotal = financeItemsInRange
            .filter { it.kind == EXPENSE }
            .sumOf { it.amount.toLong() }

        val donationTotal = financeItemsInRange
            .filter { it.kind == EXPENSE && it.description == DONATION_NAME }
            .sumOf { it.amount.toLong() }

        val flowerTotal = financeItemsInRange
            .filter { it.kind == EXPENSE && it.description == FLOWER_NAME }
            .sumOf { it.amount.toLong() }

        val otherExpenseTotal = expenseTotal - donationTotal - flowerTotal

        val activitySections = buildActivitySections(meetingsInMonth.map { it.id })

        return MonthlyReportResponse(
            yearMonth = yearMonth,
            meetingRangeLabel = rangeLabel,
            officerPresent = officerPresent,
            officerTotal = officerTotal,
            memberPresent = memberPresent,
            memberTotal = memberTotal,
            carryOverAmount = carryOverAmount,
            incomeTotal = incomeTotal,
            expenseTotal = expenseTotal,
            balance = carryOverAmount + incomeTotal - expenseTotal,
            donationTotal = donationTotal,
            flowerTotal = flowerTotal,
            otherExpenseTotal = otherExpenseTotal,
            activitySections = activitySections
        )
    }

    /** 선택된 회차 범위에 속한 모든 단원의 활동 횟수를 활동유형별로 합산하여 주요활동내역 섹션을 구성한다. */
    private fun buildActivitySections(meetingIds: List<Int>): List<MonthlyReportActivitySection> {
        val activityTypesByName = activityTypeRepository.findAllWithCategory().associateBy { it.name }

        val countsByTypeId = if (meetingIds.isEmpty()) {
            emptyMap()
        } else {
            activityCountRepository.findAllByMeeting_IdIn(meetingIds)
                .groupBy { it.activityType.id }
                .mapValues { (_, counts) -> counts.sumOf { it.count } }
        }

        fun buildItems(labels: List<Pair<String, String>>): List<MonthlyReportActivityItem> =
            labels.map { (label, typeName) ->
                val type = activityTypesByName[typeName]
                MonthlyReportActivityItem(
                    label = label,
                    count = type?.let { countsByTypeId[it.id] } ?: 0,
                    unit = type?.unit ?: "회"
                )
            }

        return listOf(
            MonthlyReportActivitySection("기도 및 신심행위", buildItems(PRAYER_ACTIVITY_LABELS)),
            MonthlyReportActivitySection("중점활동", buildItems(FOCUS_ACTIVITY_LABELS))
        )
    }

    private fun buildRangeLabel(start: Meeting, end: Meeting): String {
        val startLabel = start.sequence?.let { "${it}회차" } ?: start.meetingDate
        if (start.id == end.id) return startLabel
        val endLabel = end.sequence?.let { "${it}회차" } ?: end.meetingDate
        return "$startLabel - $endLabel"
    }

    /** 회차 날짜 기준으로 입단(joinedOn) 이후, 탈단(leftOn) 이전(또는 미탈단)인 단원인지 판단한다. */
    private fun isMemberOfMeetingDate(joinedOn: String?, leftOn: String?, meetingDate: LocalDate?): Boolean {
        if (meetingDate == null) return true

        val joined = parseFlexibleDate(joinedOn)
        if (joined != null && joined.isAfter(meetingDate)) return false

        val left = parseFlexibleDate(leftOn)
        if (left != null && left.isBefore(meetingDate)) return false

        return true
    }

    /** 회차 날짜 기준으로 간부임기가 시작일 이후이고, 종료일 이전(또는 아직 종료되지 않음)인지 판단한다. */
    private fun isTermActiveOn(startedOn: String, endedOn: String?, meetingDate: LocalDate?): Boolean {
        if (meetingDate == null) return endedOn == null

        val started = parseFlexibleDate(startedOn)
        if (started != null && started.isAfter(meetingDate)) return false

        val ended = parseFlexibleDate(endedOn)
        if (ended != null && ended.isBefore(meetingDate)) return false

        return true
    }

    /** DB에 저장된 날짜 문자열이 "yyyy-MM-dd"와 "yyyy.M.d" 두 형식을 섞어 쓰고 있어 둘 다 지원한다. */
    private fun parseFlexibleDate(value: String?): LocalDate? {
        if (value.isNullOrBlank()) return null
        val parts = value.split('-', '.').map { it.trim() }
        if (parts.size != 3) return null
        return try {
            val year = parts[0].toInt()
            val month = parts[1].toInt()
            val day = parts[2].toInt()
            LocalDate.of(year, month, day)
        } catch (ex: Exception) {
            null
        }
    }
}
