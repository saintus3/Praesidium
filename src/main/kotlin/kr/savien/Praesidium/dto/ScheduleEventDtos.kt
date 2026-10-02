package kr.savien.Praesidium.dto

/** 주요일정 캘린더에 표시할 사용자 등록 일정 응답 */
data class ScheduleEventResponse(
    val id: Int,
    val eventDate: String,
    val title: String,
    val detail: String?
)

/** 주요일정 등록/수정 요청 */
data class ScheduleEventRequest(
    val eventDate: String,
    val title: String,
    val detail: String?
)
