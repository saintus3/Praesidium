package kr.savien.Praesidium.controller

import kr.savien.Praesidium.dto.FinanceItemRequest
import kr.savien.Praesidium.dto.FinanceSummaryResponse
import kr.savien.Praesidium.service.FinanceService
import org.springframework.web.bind.annotation.DeleteMapping
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.PutMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/meetings/{meetingId}/finance")
class FinanceController(private val financeService: FinanceService) {

    @GetMapping
    fun list(@PathVariable meetingId: Int): FinanceSummaryResponse =
        financeService.list(meetingId)

    @PostMapping
    fun create(@PathVariable meetingId: Int, @RequestBody request: FinanceItemRequest): FinanceSummaryResponse =
        financeService.create(meetingId, request)

    @PutMapping("/{itemId}")
    fun update(
        @PathVariable meetingId: Int,
        @PathVariable itemId: Int,
        @RequestBody request: FinanceItemRequest
    ): FinanceSummaryResponse = financeService.update(meetingId, itemId, request)

    @DeleteMapping("/{itemId}")
    fun delete(@PathVariable meetingId: Int, @PathVariable itemId: Int): FinanceSummaryResponse =
        financeService.delete(meetingId, itemId)
}
