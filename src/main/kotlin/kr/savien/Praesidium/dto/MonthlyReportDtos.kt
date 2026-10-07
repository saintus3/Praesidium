package kr.savien.Praesidium.dto

/** 주요활동내역 섹션(예: "기도 및 신심행위", "중점활동") 내 개별 항목 */
data class MonthlyReportActivityItem(
    val label: String,
    val count: Int,
    val unit: String
)

/** 주요활동내역 섹션 */
data class MonthlyReportActivitySection(
    val title: String,
    val items: List<MonthlyReportActivityItem>
)

data class MonthlyReportEvent(
    val date: String,
    val name: String,
    val place: String?,
    val status: String
)

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
    val otherExpenseTotal: Long,
    val activitySections: List<MonthlyReportActivitySection>,
    val legioEvents: List<MonthlyReportEvent>
)
