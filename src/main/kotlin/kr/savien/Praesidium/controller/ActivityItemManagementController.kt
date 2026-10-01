package kr.savien.Praesidium.controller

import kr.savien.Praesidium.dto.ActivityTypeResponse
import kr.savien.Praesidium.service.ActivityItemManagementService
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/activity-items")
class ActivityItemManagementController(
    private val activityItemManagementService: ActivityItemManagementService
) {

    @GetMapping
    fun list(): List<ActivityTypeResponse> = activityItemManagementService.list()
}
