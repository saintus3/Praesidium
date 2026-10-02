package kr.savien.Praesidium.controller

import kr.savien.Praesidium.dto.MonthlyReportResponse
import kr.savien.Praesidium.service.MonthlyReportService
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/monthly-reports")
class MonthlyReportController(private val monthlyReportService: MonthlyReportService) {

    @GetMapping("/months")
    fun months(): List<String> = monthlyReportService.availableMonths()

    @GetMapping
    fun report(@RequestParam yearMonth: String): MonthlyReportResponse =
        monthlyReportService.report(yearMonth)
}
