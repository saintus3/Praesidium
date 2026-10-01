package kr.savien.Praesidium.controller

import kr.savien.Praesidium.repository.MeetingRepository
import org.springframework.stereotype.Controller
import org.springframework.ui.Model
import org.springframework.web.bind.annotation.GetMapping

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
        model.addAttribute("currentSession", sessions.firstOrNull()?.id ?: "")
        return "index"
    }
}

data class SessionDto(val id: String, val name: String)
