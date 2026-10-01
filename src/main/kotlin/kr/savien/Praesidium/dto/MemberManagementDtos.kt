package kr.savien.Praesidium.dto

data class MemberManagementResponse(
    val id: Int,
    val name: String,
    val baptismalName: String,
    val phone: String,
    val address: String,
    val active: Boolean,
    val joinedOn: String?,
    val leftOn: String?,
    val positionName: String?,
    val hasPhoto: Boolean
)

data class MemberManagementRequest(
    val name: String,
    val baptismalName: String,
    val phone: String,
    val address: String,
    val active: Boolean,
    val joinedOn: String?,
    val leftOn: String?
)
