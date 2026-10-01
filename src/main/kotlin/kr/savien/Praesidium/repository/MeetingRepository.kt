package kr.savien.Praesidium.repository

import kr.savien.Praesidium.domain.Meeting
import org.springframework.data.jpa.repository.JpaRepository

interface MeetingRepository : JpaRepository<Meeting, Int> {
    fun findAllByOrderBySequenceDescMeetingDateDesc(): List<Meeting>
    fun findAllByMeetingDateStartingWith(prefix: String): List<Meeting>
}
