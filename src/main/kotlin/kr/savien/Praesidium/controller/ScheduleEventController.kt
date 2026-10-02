package kr.savien.Praesidium.controller

import kr.savien.Praesidium.dto.ScheduleEventRequest
import kr.savien.Praesidium.dto.ScheduleEventResponse
import kr.savien.Praesidium.service.ScheduleEventService
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.DeleteMapping
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.PutMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.ResponseStatus
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/schedule-events")
class ScheduleEventController(
    private val scheduleEventService: ScheduleEventService
) {

    @GetMapping
    fun list(): List<ScheduleEventResponse> = scheduleEventService.list()

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    fun create(@RequestBody request: ScheduleEventRequest): ScheduleEventResponse =
        scheduleEventService.create(request)

    @PutMapping("/{id}")
    fun update(@PathVariable id: Int, @RequestBody request: ScheduleEventRequest): ScheduleEventResponse =
        scheduleEventService.update(id, request)

    @DeleteMapping("/{id}")
    fun delete(@PathVariable id: Int): ResponseEntity<Void> {
        scheduleEventService.delete(id)
        return ResponseEntity.noContent().build()
    }
}
