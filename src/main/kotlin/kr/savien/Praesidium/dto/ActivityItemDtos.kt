package kr.savien.Praesidium.dto

data class ActivityTypeResponse(
    val id: Int,
    val categoryId: Int,
    val categoryName: String,
    val name: String,
    val shortName: String?,
    val unit: String
)
