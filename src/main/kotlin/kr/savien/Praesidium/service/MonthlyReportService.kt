package kr.savien.Praesidium.service

import kr.savien.Praesidium.domain.Meeting
import kr.savien.Praesidium.dto.MonthlyReportResponse
import kr.savien.Praesidium.repository.AttendanceRepository
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
    private val attendanceRepository: AttendanceRepository
) {

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
                memberTotal = 0
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

        return MonthlyReportResponse(
            yearMonth = yearMonth,
            meetingRangeLabel = rangeLabel,
            officerPresent = officerPresent,
            officerTotal = officerTotal,
            memberPresent = memberPresent,
            memberTotal = memberTotal
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
