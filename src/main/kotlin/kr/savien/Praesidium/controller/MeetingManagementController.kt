package kr.savien.Praesidium.controller

import kr.savien.Praesidium.dto.MeetingRequest
import kr.savien.Praesidium.dto.MeetingResponse
import kr.savien.Praesidium.service.MeetingManagementService
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
@RequestMapping("/api/meeting-management")
class MeetingManagementController(
    private val meetingManagementService: MeetingManagementService
) {

    @GetMapping
    fun list(): List<MeetingResponse> = meetingManagementService.list()

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    fun create(@RequestBody request: MeetingRequest): MeetingResponse =
        meetingManagementService.create(request)

    @PutMapping("/{id}")
    fun update(@PathVariable id: Int, @RequestBody request: MeetingRequest): MeetingResponse =
        meetingManagementService.update(id, request)

    @DeleteMapping("/{id}")
    fun delete(@PathVariable id: Int): ResponseEntity<Void> {
        meetingManagementService.delete(id)
        return ResponseEntity.noContent().build()
    }
}
