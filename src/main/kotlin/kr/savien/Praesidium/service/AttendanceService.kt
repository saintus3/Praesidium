package kr.savien.Praesidium.service

import kr.savien.Praesidium.domain.Attendance
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

@Service
@Transactional(readOnly = true)
class AttendanceService(
    private val attendanceRepository: AttendanceRepository,
    private val meetingRepository: MeetingRepository,
    private val memberRepository: MemberRepository,
    private val officerTermRepository: OfficerTermRepository
) {

    fun listAttendance(meetingId: Int): List<AttendanceMemberResponse> {
        if (!meetingRepository.existsById(meetingId)) {
            throw ResponseStatusException(HttpStatus.NOT_FOUND, "회차를 찾을 수 없습니다. (id=$meetingId)")
        }

        val presentMemberIds = attendanceRepository.findAllByMeetingId(meetingId)
            .filter { it.status == "PRESENT" }
            .map { it.member.id }
            .toSet()

        val currentPositionByMemberId = officerTermRepository.findAllCurrentWithPosition()
            .groupBy { it.member.id }
            .mapValues { (_, terms) -> terms.first().position.name }

        return memberRepository.findAllByOrderByNameAsc().map { member ->
            AttendanceMemberResponse(
                memberId = member.id,
                memberName = member.name,
                memberBaptismalName = member.baptismalName,
                positionName = currentPositionByMemberId[member.id],
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
}
