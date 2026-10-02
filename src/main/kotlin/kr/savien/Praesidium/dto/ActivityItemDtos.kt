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

/** 활동 메뉴 기본 그리드(평일미사 등 8개 항목)에 포함되지 않은, 이번 회차에 등록된 추가 활동 목록 */
data class ActivityCountExtraItemResponse(
    val id: Int,
    val memberId: Int,
    val memberName: String,
    val memberBaptismalName: String,
    val categoryId: Int,
    val categoryName: String,
    val activityTypeId: Int,
    val activityTypeName: String,
    val shortName: String?,
    val unit: String,
    val count: Int
)
