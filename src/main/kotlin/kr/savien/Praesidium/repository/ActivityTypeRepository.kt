package kr.savien.Praesidium.repository

import kr.savien.Praesidium.domain.ActivityType
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query

interface ActivityTypeRepository : JpaRepository<ActivityType, Int> {

    @Query(
        "SELECT t FROM ActivityType t " +
            "JOIN FETCH t.category c " +
            "ORDER BY c.sortOrder ASC, t.sortOrder ASC"
    )
    fun findAllWithCategory(): List<ActivityType>
}
