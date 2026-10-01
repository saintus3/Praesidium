package kr.savien.Praesidium.repository

import kr.savien.Praesidium.domain.ActivityCategory
import org.springframework.data.jpa.repository.JpaRepository

interface ActivityCategoryRepository : JpaRepository<ActivityCategory, Int> {
    fun findAllByOrderBySortOrderAsc(): List<ActivityCategory>
}
