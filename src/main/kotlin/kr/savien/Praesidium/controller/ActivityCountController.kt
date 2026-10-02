package kr.savien.Praesidium.controller

import kr.savien.Praesidium.dto.ActivityCountExtraItemResponse
import kr.savien.Praesidium.dto.ActivityCountGridResponse
import kr.savien.Praesidium.dto.ActivityCountUpdateRequest
import kr.savien.Praesidium.service.ActivityCountService
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PutMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/meetings/{meetingId}/activity-counts")
class ActivityCountController(private val activityCountService: ActivityCountService) {

    @GetMapping
    fun grid(@PathVariable meetingId: Int): ActivityCountGridResponse =
        activityCountService.grid(meetingId)

    @GetMapping("/extra")
    fun extra(@PathVariable meetingId: Int): List<ActivityCountExtraItemResponse> =
        activityCountService.extra(meetingId)

    @PutMapping
    fun update(
        @PathVariable meetingId: Int,
        @RequestBody request: ActivityCountUpdateRequest
    ): ResponseEntity<Void> {
        activityCountService.update(meetingId, request)
        return ResponseEntity.noContent().build()
    }
}
