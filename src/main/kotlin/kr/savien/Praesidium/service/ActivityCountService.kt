package kr.savien.Praesidium.service

import kr.savien.Praesidium.domain.ActivityCount
import kr.savien.Praesidium.domain.Member
import kr.savien.Praesidium.dto.ActivityCountCellResponse
import kr.savien.Praesidium.dto.ActivityCountColumnResponse
import kr.savien.Praesidium.dto.ActivityCountExtraItemResponse
import kr.savien.Praesidium.dto.ActivityCountGridResponse
import kr.savien.Praesidium.dto.ActivityCountMemberResponse
import kr.savien.Praesidium.dto.ActivityCountUpdateRequest
import kr.savien.Praesidium.repository.ActivityCountRepository
import kr.savien.Praesidium.repository.ActivityTypeRepository
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
class ActivityCountService(
    private val activityCountRepository: ActivityCountRepository,
    private val activityTypeRepository: ActivityTypeRepository,
    private val meetingRepository: MeetingRepository,
    private val memberRepository: MemberRepository,
    private val officerTermRepository: OfficerTermRepository
) {

    companion object {
        /** 활동 그리드에 표시할 활동항목(활동기본명) 순서 */
        private val DISPLAY_SHORT_NAMES = listOf(
            "평일미사", "묵주기도", "복음묵상", "일상기도", "21시주모경", "월간지", "성경읽기", "가정성화"
        )
    }

    fun grid(meetingId: Int): ActivityCountGridResponse {
        val meeting = meetingRepository.findById(meetingId)
            .orElseThrow { ResponseStatusException(HttpStatus.NOT_FOUND, "회차를 찾을 수 없습니다. (id=$meetingId)") }
        val meetingDate = parseFlexibleDate(meeting.meetingDate)

        val allTypes = activityTypeRepository.findAllWithCategory()
        val typesByShortName = allTypes.filter { !it.shortName.isNullOrBlank() }
            .associateBy { it.shortName }
        val columnTypes = DISPLAY_SHORT_NAMES.mapNotNull { typesByShortName[it] }
        val columns = columnTypes.map {
            ActivityCountColumnResponse(
                activityTypeId = it.id,
                name = it.name,
                shortName = it.shortName,
                unit = it.unit
            )
        }
        val columnTypeIds = columnTypes.map { it.id }.toSet()

        val countsByMemberAndType = activityCountRepository.findAllByMeeting_Id(meetingId)
            .filter { it.member != null && it.activityType.id in columnTypeIds }
            .associateBy { Pair(it.member!!.id, it.activityType.id) }

        val currentTermByMemberId = officerTermRepository.findAllWithDetails()
            .filter { term -> isTermActiveOn(term.startedOn, term.endedOn, meetingDate) }
            .groupBy { it.member.id }
            .mapValues { (_, terms) -> terms.first() }

        val members = memberRepository.findAllByOrderByNameAsc()
            .filter { member -> isMemberOfMeetingDate(member.joinedOn, member.leftOn, meetingDate) }

        val sortedMembers = members.sortedWith(
            compareBy<Member> { member ->
                currentTermByMemberId[member.id]?.position?.sortOrder ?: Int.MAX_VALUE
            }.thenBy { member ->
                parseFlexibleDate(member.joinedOn) ?: LocalDate.MAX
            }.thenBy { it.name }
        )

        val memberResponses = sortedMembers.map { member ->
            ActivityCountMemberResponse(
                memberId = member.id,
                memberName = member.name,
                memberBaptismalName = member.baptismalName,
                positionName = currentTermByMemberId[member.id]?.position?.name,
                counts = columnTypes.map { type ->
                    ActivityCountCellResponse(
                        activityTypeId = type.id,
                        count = countsByMemberAndType[Pair(member.id, type.id)]?.count ?: 0
                    )
                }
            )
        }

        return ActivityCountGridResponse(columns = columns, members = memberResponses)
    }

    /** 활동 그리드 기본 8개 항목을 제외하고, 이번 회차에 등록된 그 외 활동 기록을 반환한다. */
    fun extra(meetingId: Int): List<ActivityCountExtraItemResponse> {
        if (!meetingRepository.existsById(meetingId)) {
            throw ResponseStatusException(HttpStatus.NOT_FOUND, "회차를 찾을 수 없습니다. (id=$meetingId)")
        }

        return activityCountRepository.findAllByMeeting_Id(meetingId)
            .filter {
                it.member != null &&
                    it.count > 0 &&
                    it.activityType.shortName !in DISPLAY_SHORT_NAMES
            }
            .sortedWith(
                compareBy<ActivityCount> { it.activityType.category.sortOrder }
                    .thenBy { it.activityType.sortOrder }
                    .thenBy { it.member!!.name }
            )
            .map {
                ActivityCountExtraItemResponse(
                    id = it.id,
                    memberId = it.member!!.id,
                    memberName = it.member!!.name,
                    memberBaptismalName = it.member!!.baptismalName,
                    categoryId = it.activityType.category.id,
                    categoryName = it.activityType.category.name,
                    activityTypeId = it.activityType.id,
                    activityTypeName = it.activityType.name,
                    shortName = it.activityType.shortName,
                    unit = it.activityType.unit,
                    count = it.count
                )
            }
    }

    @Transactional
    fun update(meetingId: Int, request: ActivityCountUpdateRequest) {
        val meeting = meetingRepository.findById(meetingId)
            .orElseThrow { ResponseStatusException(HttpStatus.NOT_FOUND, "회차를 찾을 수 없습니다. (id=$meetingId)") }
        val member = memberRepository.findById(request.memberId)
            .orElseThrow { ResponseStatusException(HttpStatus.BAD_REQUEST, "존재하지 않는 단원입니다. (id=${request.memberId})") }
        val activityType = activityTypeRepository.findById(request.activityTypeId)
            .orElseThrow { ResponseStatusException(HttpStatus.BAD_REQUEST, "존재하지 않는 활동항목입니다. (id=${request.activityTypeId})") }
        if (request.count < 0) {
            throw ResponseStatusException(HttpStatus.BAD_REQUEST, "활동 횟수는 0 이상이어야 합니다.")
        }

        val existing = activityCountRepository.findByMeeting_IdAndMember_IdAndActivityType_Id(
            meetingId, request.memberId, request.activityTypeId
        )

        if (existing == null) {
            activityCountRepository.save(
                ActivityCount(meeting = meeting, member = member, activityType = activityType, count = request.count)
            )
        } else if (existing.count != request.count) {
            existing.count = request.count
            activityCountRepository.save(existing)
        }
    }

    /** 이번 회차 등록 활동 목록에서 특정 레코드를 수정한다. (단원/활동항목/횟수 변경 가능) */
    @Transactional
    fun updateExtra(meetingId: Int, id: Int, request: ActivityCountUpdateRequest) {
        val record = activityCountRepository.findById(id)
            .orElseThrow { ResponseStatusException(HttpStatus.NOT_FOUND, "활동 기록을 찾을 수 없습니다. (id=$id)") }
        if (record.meeting.id != meetingId) {
            throw ResponseStatusException(HttpStatus.NOT_FOUND, "활동 기록을 찾을 수 없습니다. (id=$id)")
        }
        val member = memberRepository.findById(request.memberId)
            .orElseThrow { ResponseStatusException(HttpStatus.BAD_REQUEST, "존재하지 않는 단원입니다. (id=${request.memberId})") }
        val activityType = activityTypeRepository.findById(request.activityTypeId)
            .orElseThrow { ResponseStatusException(HttpStatus.BAD_REQUEST, "존재하지 않는 활동항목입니다. (id=${request.activityTypeId})") }
        if (request.count < 0) {
            throw ResponseStatusException(HttpStatus.BAD_REQUEST, "활동 횟수는 0 이상이어야 합니다.")
        }

        val duplicate = activityCountRepository.findByMeeting_IdAndMember_IdAndActivityType_Id(
            meetingId, request.memberId, request.activityTypeId
        )
        if (duplicate != null && duplicate.id != id) {
            throw ResponseStatusException(HttpStatus.CONFLICT, "해당 단원/활동항목 조합은 이미 등록되어 있습니다.")
        }

        record.member = member
        record.activityType = activityType
        record.count = request.count
        activityCountRepository.save(record)
    }

    /** 이번 회차 등록 활동 목록에서 특정 레코드를 삭제한다. */
    @Transactional
    fun deleteExtra(meetingId: Int, id: Int) {
        val record = activityCountRepository.findById(id)
            .orElseThrow { ResponseStatusException(HttpStatus.NOT_FOUND, "활동 기록을 찾을 수 없습니다. (id=$id)") }
        if (record.meeting.id != meetingId) {
            throw ResponseStatusException(HttpStatus.NOT_FOUND, "활동 기록을 찾을 수 없습니다. (id=$id)")
        }
        activityCountRepository.deleteById(id)
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
