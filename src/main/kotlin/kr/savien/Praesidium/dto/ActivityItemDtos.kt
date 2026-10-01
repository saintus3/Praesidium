package kr.savien.Praesidium.dto

data class ActivityTypeResponse(
    val id: Int,
    val categoryId: Int,
    val categoryName: String,
    val name: String,
    val shortName: String?,
    val unit: String
)

data class ActivityCountColumnResponse(
    val activityTypeId: Int,
    val name: String,
    val shortName: String?,
    val unit: String
)

data class ActivityCountCellResponse(
    val activityTypeId: Int,
    val count: Int
)

data class ActivityCountMemberResponse(
    val memberId: Int,
    val memberName: String,
    val memberBaptismalName: String,
    val positionName: String?,
    val counts: List<ActivityCountCellResponse>
)

data class ActivityCountGridResponse(
    val columns: List<ActivityCountColumnResponse>,
    val members: List<ActivityCountMemberResponse>
)

data class ActivityCountUpdateRequest(
    val memberId: Int,
    val activityTypeId: Int,
    val count: Int
)
