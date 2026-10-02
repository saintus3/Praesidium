package kr.savien.Praesidium.repository

import kr.savien.Praesidium.domain.Finance
import org.springframework.data.jpa.repository.JpaRepository

interface FinanceRepository : JpaRepository<Finance, Int> {
    fun findAllByMeeting_IdOrderByIdAsc(meetingId: Int): List<Finance>
    fun existsByMeeting_Id(meetingId: Int): Boolean
}
