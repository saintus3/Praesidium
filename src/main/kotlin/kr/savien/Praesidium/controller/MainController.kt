package kr.savien.Praesidium.controller

import kr.savien.Praesidium.repository.MeetingRepository
import org.springframework.stereotype.Controller
import org.springframework.ui.Model
import org.springframework.web.bind.annotation.GetMapping
import java.time.LocalDate

@Controller
class MainController(private val meetingRepository: MeetingRepository) {

    @GetMapping("/")
    fun index(model: Model): String {
        val meetings = meetingRepository.findAllByOrderBySequenceDescMeetingDateDesc()
        val sessions = meetings.map { meeting ->
            val label = if (meeting.sequence != null) {
                "${meeting.sequence}회차 (${meeting.meetingDate})"
            } else {
                meeting.meetingDate
            }
            SessionDto(meeting.id.toString(), label)
        }
        model.addAttribute("sessions", sessions)
        val today = LocalDate.now()
        val previousMeeting = meetings
            .map { meeting -> LocalDate.parse(meeting.meetingDate.replace('.', '-')) to meeting }
            .filter { (meetingDate, _) -> meetingDate.isBefore(today) }
            .maxByOrNull { (meetingDate, _) -> meetingDate }
            ?.second
        model.addAttribute(
            "currentSession",
            (previousMeeting ?: meetings.firstOrNull())?.id?.toString() ?: ""
        )
        return "index"
    }
}

data class SessionDto(val id: String, val name: String)
