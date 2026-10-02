package kr.savien.Praesidium.service

import kr.savien.Praesidium.domain.ScheduleEvent
import kr.savien.Praesidium.dto.ScheduleEventRequest
import kr.savien.Praesidium.dto.ScheduleEventResponse
import kr.savien.Praesidium.repository.ScheduleEventRepository
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import org.springframework.web.server.ResponseStatusException

@Service
@Transactional(readOnly = true)
class ScheduleEventService(
    private val scheduleEventRepository: ScheduleEventRepository
) {

    fun list(): List<ScheduleEventResponse> =
        scheduleEventRepository.findAllByOrderByEventDateAsc().map { it.toResponse() }

    @Transactional
    fun create(request: ScheduleEventRequest): ScheduleEventResponse {
        validate(request)
        val saved = scheduleEventRepository.save(
            ScheduleEvent(
                eventDate = request.eventDate,
                title = request.title.trim(),
                detail = request.detail?.takeIf { it.isNotBlank() }
            )
        )
        return saved.toResponse()
    }

    @Transactional
    fun update(id: Int, request: ScheduleEventRequest): ScheduleEventResponse {
        val event = scheduleEventRepository.findById(id)
            .orElseThrow { ResponseStatusException(HttpStatus.NOT_FOUND, "일정을 찾을 수 없습니다. (id=$id)") }

        validate(request)

        event.eventDate = request.eventDate
        event.title = request.title.trim()
        event.detail = request.detail?.takeIf { it.isNotBlank() }

        return scheduleEventRepository.save(event).toResponse()
    }

    @Transactional
    fun delete(id: Int) {
        if (!scheduleEventRepository.existsById(id)) {
            throw ResponseStatusException(HttpStatus.NOT_FOUND, "일정을 찾을 수 없습니다. (id=$id)")
        }
        scheduleEventRepository.deleteById(id)
    }

    private fun validate(request: ScheduleEventRequest) {
        if (request.eventDate.isBlank()) {
            throw ResponseStatusException(HttpStatus.BAD_REQUEST, "일자는 필수입니다.")
        }
        if (request.title.isBlank()) {
            throw ResponseStatusException(HttpStatus.BAD_REQUEST, "제목은 필수입니다.")
        }
    }

    private fun ScheduleEvent.toResponse() = ScheduleEventResponse(
        id = id,
        eventDate = eventDate,
        title = title,
        detail = detail
    )
}
