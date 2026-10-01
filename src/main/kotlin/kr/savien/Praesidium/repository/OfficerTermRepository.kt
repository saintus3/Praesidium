package kr.savien.Praesidium.repository

import kr.savien.Praesidium.domain.OfficerTerm
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query

interface OfficerTermRepository : JpaRepository<OfficerTerm, Int> {

    @Query(
        "SELECT ot FROM OfficerTerm ot " +
            "JOIN FETCH ot.position p " +
            "JOIN FETCH ot.member m " +
            "ORDER BY p.sortOrder ASC, ot.startedOn DESC"
    )
    fun findAllWithDetails(): List<OfficerTerm>

    @Query(
        "SELECT ot FROM OfficerTerm ot " +
            "JOIN FETCH ot.position p " +
            "WHERE ot.endedOn IS NULL " +
            "ORDER BY p.sortOrder ASC"
    )
    fun findAllCurrentWithPosition(): List<OfficerTerm>

    fun existsByMember_Id(memberId: Int): Boolean
}
