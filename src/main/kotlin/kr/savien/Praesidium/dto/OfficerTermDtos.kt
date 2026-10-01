package kr.savien.Praesidium.dto

data class PositionOptionResponse(
    val id: Int,
    val code: String,
    val name: String
)

data class MemberOptionResponse(
    val id: Int,
    val name: String,
    val baptismalName: String,
    val active: Boolean
)

data class OfficerTermResponse(
    val id: Int,
    val positionId: Int,
    val positionName: String,
    val memberId: Int,
    val memberName: String,
    val memberBaptismalName: String,
    val startedOn: String,
    val endedOn: String?
)

data class OfficerTermRequest(
    val positionId: Int,
    val memberId: Int,
    val startedOn: String,
    val endedOn: String?
)
