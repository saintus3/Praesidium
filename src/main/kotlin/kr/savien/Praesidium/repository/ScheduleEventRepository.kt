package kr.savien.Praesidium.repository

import kr.savien.Praesidium.domain.ScheduleEvent
import org.springframework.data.jpa.repository.JpaRepository

interface ScheduleEventRepository : JpaRepository<ScheduleEvent, Int> {
    fun findAllByOrderByEventDateAsc(): List<ScheduleEvent>
    fun findAllByEventDateStartingWith(prefix: String): List<ScheduleEvent>
}
