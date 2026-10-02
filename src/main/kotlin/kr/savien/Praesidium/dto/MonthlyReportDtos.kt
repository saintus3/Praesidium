package kr.savien.Praesidium.dto

/** 월례보고 화면에서 선택 가능한 년-월(yyyy-MM) 목록 응답에 사용한다. */
data class MonthlyReportResponse(
    val yearMonth: String,
    val meetingRangeLabel: String,
    val officerPresent: Int,
    val officerTotal: Int,
    val memberPresent: Int,
    val memberTotal: Int,
    val carryOverAmount: Long,
    val incomeTotal: Long,
    val expenseTotal: Long,
    val balance: Long,
    val donationTotal: Long,
    val flowerTotal: Long,
    val otherExpenseTotal: Long
)
