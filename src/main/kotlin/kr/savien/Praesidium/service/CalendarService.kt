package kr.savien.Praesidium.service

import kr.savien.Praesidium.dto.CalendarEventResponse
import kr.savien.Praesidium.repository.FeastDayRepository
import kr.savien.Praesidium.repository.MeetingRepository
import kr.savien.Praesidium.repository.MemberRepository
import kr.savien.Praesidium.repository.ScheduleEventRepository
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
@Transactional(readOnly = true)
class CalendarService(
    private val feastDayRepository: FeastDayRepository,
    private val memberRepository: MemberRepository,
    private val meetingRepository: MeetingRepository,
    private val scheduleEventRepository: ScheduleEventRepository
) {

    fun getMonthEvents(year: Int, month: Int): List<CalendarEventResponse> {
        val events = mutableListOf<CalendarEventResponse>()

        val membersByBaptismalName = memberRepository.findAllByOrderByNameAsc()
            .filter { it.active == 1 }
            .groupBy { it.baptismalName }

        feastDayRepository.findAllByMonth(month).forEach { feast ->
            val dateStr = "%04d-%02d-%02d".format(year, feast.month, feast.day)
            events.add(
                CalendarEventResponse(
                    date = dateStr,
                    type = "FEAST_DAY",
                    title = feast.name,
                    detail = feast.fullName
                )
            )
            membersByBaptismalName[feast.name]?.forEach { member ->
                events.add(
                    CalendarEventResponse(
                        date = dateStr,
                        type = "MEMBER_FEAST",
                        title = "${member.name} (${member.baptismalName})",
                        detail = "단원 영명축일"
                    )
                )
            }
        }

        val prefix = "%04d-%02d".format(year, month)
        meetingRepository.findAllByMeetingDateStartingWith(prefix).forEach { meeting ->
            val label = if (meeting.sequence != null) "${meeting.sequence}회차 주회합" else "주회합"
            events.add(
                CalendarEventResponse(
                    date = meeting.meetingDate,
                    type = "MEETING",
                    title = label,
                    detail = meeting.notes.ifBlank { null }
                )
            )
        }

        val prefix2 = "%04d-%02d".format(year, month)
        scheduleEventRepository.findAllByEventDateStartingWith(prefix2).forEach { schedule ->
            events.add(
                CalendarEventResponse(
                    date = schedule.eventDate,
                    type = "SCHEDULE",
                    title = schedule.title,
                    detail = schedule.detail,
                    id = schedule.id
                )
            )
        }

        return events
    }
}
