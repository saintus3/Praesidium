package kr.savien.Praesidium.dto

data class AttendanceMemberResponse(
    val memberId: Int,
    val memberName: String,
    val memberBaptismalName: String,
    val positionName: String?,
    val present: Boolean
)

data class AttendanceUpdateRequest(
    val memberId: Int,
    val present: Boolean
)
