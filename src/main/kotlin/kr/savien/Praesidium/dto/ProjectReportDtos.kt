package kr.savien.Praesidium.dto

data class ProjectReportResponse(
    val year: Int,
    val officerPresent: Int,
    val officerTotal: Int,
    val memberPresent: Int,
    val memberTotal: Int,
    val carryOverAmount: Long,
    val incomeTotal: Long,
    val expenseTotal: Long,
    val balance: Long,
    val activityCategories: List<ProjectReportActivityCategory>,
    val legioEvents: List<ProjectReportEvent>
)

data class ProjectReportActivityCategory(
    val name: String,
    val total: Int,
    val activities: List<ProjectReportActivity>
)

data class ProjectReportActivity(
    val name: String,
    val count: Int,
    val unit: String
)

data class ProjectReportEvent(
    val date: String,
    val name: String,
    val place: String?
)
