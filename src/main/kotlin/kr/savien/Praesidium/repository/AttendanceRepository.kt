package kr.savien.Praesidium.repository

import kr.savien.Praesidium.domain.Attendance
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param

interface AttendanceRepository : JpaRepository<Attendance, Int> {

    @Query("SELECT a FROM Attendance a JOIN FETCH a.member WHERE a.meeting.id = :meetingId")
    fun findAllByMeetingId(@Param("meetingId") meetingId: Int): List<Attendance>

    fun findByMeetingIdAndMemberId(meetingId: Int, memberId: Int): Attendance?

    fun deleteByMeetingIdAndMemberId(meetingId: Int, memberId: Int): Long

    fun existsByMember_Id(memberId: Int): Boolean
}
