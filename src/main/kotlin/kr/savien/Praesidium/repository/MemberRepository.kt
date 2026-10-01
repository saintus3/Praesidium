package kr.savien.Praesidium.repository

import kr.savien.Praesidium.domain.Member
import org.springframework.data.jpa.repository.JpaRepository

interface MemberRepository : JpaRepository<Member, Int> {
    fun findAllByOrderByNameAsc(): List<Member>
}
