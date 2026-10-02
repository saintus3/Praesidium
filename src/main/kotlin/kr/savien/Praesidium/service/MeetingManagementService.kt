package kr.savien.Praesidium.service

import kr.savien.Praesidium.domain.Meeting
import kr.savien.Praesidium.dto.MeetingRequest
import kr.savien.Praesidium.dto.MeetingResponse
import kr.savien.Praesidium.repository.ActivityCountRepository
import kr.savien.Praesidium.repository.AttendanceRepository
import kr.savien.Praesidium.repository.FinanceRepository
import kr.savien.Praesidium.repository.MeetingRepository
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import org.springframework.web.server.ResponseStatusException
import java.time.LocalDate
import java.time.LocalTime
import java.time.format.DateTimeParseException
import java.time.format.TextStyle
import java.util.Locale

@Service
@Transactional(readOnly = true)
class MeetingManagementService(
    private val meetingRepository: MeetingRepository,
    private val attendanceRepository: AttendanceRepository,
    private val financeRepository: FinanceRepository,
    private val activityCountRepository: ActivityCountRepository
) {

    fun list(): List<MeetingResponse> =
        meetingRepository.findAllByOrderBySequenceDescMeetingDateDesc().map { it.toResponse() }

    @Transactional
    fun create(request: MeetingRequest): MeetingResponse {
        validate(request)
        val saved = meetingRepository.save(
            Meeting(
                meetingDate = request.meetingDate,
                startTime = parseStartTime(request.startTime),
                place = request.place?.takeIf { it.isNotBlank() },
                sequence = request.sequence,
                notes = request.notes ?: ""
            )
        )
        return saved.toResponse()
    }

    @Transactional
    fun update(id: Int, request: MeetingRequest): MeetingResponse {
        val meeting = meetingRepository.findById(id)
            .orElseThrow { ResponseStatusException(HttpStatus.NOT_FOUND, "회차를 찾을 수 없습니다. (id=$id)") }

        validate(request)

        meeting.meetingDate = request.meetingDate
        meeting.startTime = parseStartTime(request.startTime)
        meeting.place = request.place?.takeIf { it.isNotBlank() }
        meeting.sequence = request.sequence
        meeting.notes = request.notes ?: ""

        return meetingRepository.save(meeting).toResponse()
    }

    @Transactional
    fun delete(id: Int) {
        if (!meetingRepository.existsById(id)) {
            throw ResponseStatusException(HttpStatus.NOT_FOUND, "회차를 찾을 수 없습니다. (id=$id)")
        }
        // 주의: DB의 attendance/finance/activity_counts FK는 ON DELETE CASCADE 로 설정되어 있어
        // DB 레벨에서는 예외 없이 연관 기록이 함께 삭제된다. 반드시 삭제 전에 애플리케이션 레벨에서
        // 연관 기록 존재 여부를 먼저 확인하여 차단해야 한다.
        val hasRelatedRecords = attendanceRepository.existsByMeeting_Id(id) ||
            financeRepository.existsByMeeting_Id(id) ||
            activityCountRepository.existsByMeeting_Id(id)
        if (hasRelatedRecords) {
            throw ResponseStatusException(
                HttpStatus.CONFLICT,
                "해당 회차에 출석/회계/활동 기록이 존재하여 삭제할 수 없습니다."
            )
        }
        meetingRepository.deleteById(id)
    }

    private fun validate(request: MeetingRequest) {
        if (request.meetingDate.isBlank()) {
            throw ResponseStatusException(HttpStatus.BAD_REQUEST, "일자는 필수입니다.")
        }
    }

    private fun parseStartTime(value: String?): LocalTime? {
        if (value.isNullOrBlank()) return null
        return try {
            LocalTime.parse(value)
        } catch (ex: DateTimeParseException) {
            throw ResponseStatusException(HttpStatus.BAD_REQUEST, "시간 형식이 올바르지 않습니다. (HH:mm)")
        }
    }

    private fun dayOfWeekLabel(meetingDate: String): String {
        val date = try {
            LocalDate.parse(meetingDate.replace('.', '-'))
        } catch (ex: Exception) {
            null
        }
        return date?.dayOfWeek?.getDisplayName(TextStyle.SHORT, Locale.KOREAN)?.let { "($it)" } ?: ""
    }

    private fun Meeting.toResponse() = MeetingResponse(
        id = id,
        meetingDate = meetingDate,
        dayOfWeek = dayOfWeekLabel(meetingDate),
        startTime = startTime?.toString(),
        place = place,
        sequence = sequence,
        notes = notes
    )
}
