package kr.savien.Praesidium.controller

import org.springframework.stereotype.Controller
import org.springframework.ui.Model
import org.springframework.web.bind.annotation.GetMapping

@Controller
class MainController {

    @GetMapping("/")
    fun index(model: Model): String {
        val sessions = listOf(
            SessionDto("12", "2026년도 하반기 (12회차)"),
            SessionDto("11", "2026년도 상반기 (11회차)"),
            SessionDto("10", "2025년도 하반기 (10회차)"),
            SessionDto("9", "2025년도 상반기 (9회차)")
        );
        model.addAttribute("sessions", sessions);
        model.addAttribute("currentSession", "12");
        return "index";
    }
}

data class SessionDto(val id: String, val name: String)
