package kr.savien.Praesidium.domain

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.GeneratedValue
import jakarta.persistence.GenerationType
import jakarta.persistence.Id
import jakarta.persistence.Table

/** 주요일정 캘린더에서 사용자가 직접 등록/수정/삭제하는 일정 */
@Entity
@Table(name = "schedule_events")
class ScheduleEvent(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Int = 0,

    @Column(name = "event_date", nullable = false, length = 10)
    var eventDate: String = "",

    @Column(name = "title", nullable = false, length = 200)
    var title: String = "",

    @Column(name = "detail", length = 500)
    var detail: String? = null
)
