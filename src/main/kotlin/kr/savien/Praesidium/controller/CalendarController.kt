package kr.savien.Praesidium.controller

import kr.savien.Praesidium.dto.CalendarEventResponse
import kr.savien.Praesidium.service.CalendarService
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/calendar")
class CalendarController(private val calendarService: CalendarService) {

    @GetMapping
    fun events(
        @RequestParam year: Int,
        @RequestParam month: Int
    ): List<CalendarEventResponse> = calendarService.getMonthEvents(year, month)
}
