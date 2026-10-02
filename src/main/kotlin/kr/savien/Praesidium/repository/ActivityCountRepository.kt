package kr.savien.Praesidium.repository

import kr.savien.Praesidium.domain.ActivityCount
import org.springframework.data.jpa.repository.JpaRepository

interface ActivityCountRepository : JpaRepository<ActivityCount, Int> {
    fun findAllByMeeting_Id(meetingId: Int): List<ActivityCount>
    fun findAllByMeeting_IdIn(meetingIds: List<Int>): List<ActivityCount>
    fun findByMeeting_IdAndMember_IdAndActivityType_Id(
        meetingId: Int,
        memberId: Int,
        activityTypeId: Int
    ): ActivityCount?
}
