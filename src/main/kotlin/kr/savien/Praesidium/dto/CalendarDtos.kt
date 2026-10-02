package kr.savien.Praesidium.dto

data class CalendarEventResponse(
    val date: String,
    val type: String,
    val title: String,
    val detail: String?,
    val id: Int? = null
)
