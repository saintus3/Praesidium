package kr.savien.Praesidium.service

import kr.savien.Praesidium.domain.Attendance
import kr.savien.Praesidium.domain.Member
import kr.savien.Praesidium.dto.AttendanceMemberResponse
import kr.savien.Praesidium.dto.AttendanceUpdateRequest
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
class AttendanceService(
    private val attendanceRepository: AttendanceRepository,
    private val meetingRepository: MeetingRepository,
    private val memberRepository: MemberRepository,
    private val officerTermRepository: OfficerTermRepository
) {

    fun listAttendance(meetingId: Int): List<AttendanceMemberResponse> {
        val meeting = meetingRepository.findById(meetingId)
            .orElseThrow { ResponseStatusException(HttpStatus.NOT_FOUND, "회차를 찾을 수 없습니다. (id=$meetingId)") }
        val meetingDate = parseFlexibleDate(meeting.meetingDate)

        val presentMemberIds = attendanceRepository.findAllByMeetingId(meetingId)
            .filter { it.status == "PRESENT" }
            .map { it.member.id }
            .toSet()

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

        return sortedMembers.map { member ->
            AttendanceMemberResponse(
                memberId = member.id,
                memberName = member.name,
                memberBaptismalName = member.baptismalName,
                positionName = currentTermByMemberId[member.id]?.position?.name,
                present = presentMemberIds.contains(member.id)
            )
        }
    }

    @Transactional
    fun updateAttendance(meetingId: Int, request: AttendanceUpdateRequest) {
        val meeting = meetingRepository.findById(meetingId)
            .orElseThrow { ResponseStatusException(HttpStatus.NOT_FOUND, "회차를 찾을 수 없습니다. (id=$meetingId)") }
        val member = memberRepository.findById(request.memberId)
            .orElseThrow { ResponseStatusException(HttpStatus.BAD_REQUEST, "존재하지 않는 단원입니다. (id=${request.memberId})") }

        val existing = attendanceRepository.findByMeetingIdAndMemberId(meetingId, request.memberId)
        val status = if (request.present) "PRESENT" else "ABSENT"

        if (existing == null) {
            attendanceRepository.save(
                Attendance(meeting = meeting, member = member, status = status)
            )
        } else if (existing.status != status) {
            existing.status = status
            attendanceRepository.save(existing)
        }
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

