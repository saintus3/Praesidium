package kr.savien.Praesidium.repository

import kr.savien.Praesidium.domain.Position
import org.springframework.data.jpa.repository.JpaRepository

interface PositionRepository : JpaRepository<Position, Int> {
    fun findAllByOrderBySortOrderAsc(): List<Position>
}
