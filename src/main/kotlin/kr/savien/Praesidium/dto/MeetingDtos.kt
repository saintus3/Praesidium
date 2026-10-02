package kr.savien.Praesidium.dto

/** 주회합관리 목록/수정 화면에 사용하는 회차 응답 */
data class MeetingResponse(
    val id: Int,
    val meetingDate: String,
    val sequence: Int?,
    val notes: String
)

/** 주회합 등록/수정 요청 */
data class MeetingRequest(
    val meetingDate: String,
    val sequence: Int?,
    val notes: String?
)
