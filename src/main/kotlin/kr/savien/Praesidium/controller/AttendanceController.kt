package kr.savien.Praesidium.controller

import kr.savien.Praesidium.dto.AttendanceMemberResponse
import kr.savien.Praesidium.dto.AttendanceUpdateRequest
import kr.savien.Praesidium.service.AttendanceService
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PutMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/meetings/{meetingId}/attendance")
class AttendanceController(private val attendanceService: AttendanceService) {

    @GetMapping
    fun list(@PathVariable meetingId: Int): List<AttendanceMemberResponse> =
        attendanceService.listAttendance(meetingId)

    @PutMapping
    fun update(@PathVariable meetingId: Int, @RequestBody request: AttendanceUpdateRequest): ResponseEntity<Void> {
        attendanceService.updateAttendance(meetingId, request)
        return ResponseEntity.noContent().build()
    }
}
