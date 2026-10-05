package kr.savien.Praesidium.controller

import kr.savien.Praesidium.dto.ProjectReportResponse
import kr.savien.Praesidium.service.ProjectReportService
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/project-reports")
class ProjectReportController(private val projectReportService: ProjectReportService) {

    @GetMapping("/years")
    fun years(): List<Int> = projectReportService.availableYears()

    @GetMapping
    fun report(@RequestParam year: Int): ProjectReportResponse = projectReportService.report(year)
}
