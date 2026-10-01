package kr.savien.Praesidium.repository

import kr.savien.Praesidium.domain.FeastDay
import org.springframework.data.jpa.repository.JpaRepository

interface FeastDayRepository : JpaRepository<FeastDay, Int> {
    fun findAllByMonth(month: Int): List<FeastDay>
}
