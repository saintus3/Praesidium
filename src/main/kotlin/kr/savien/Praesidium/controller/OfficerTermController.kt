package kr.savien.Praesidium.controller

import kr.savien.Praesidium.dto.MemberOptionResponse
import kr.savien.Praesidium.dto.OfficerTermRequest
import kr.savien.Praesidium.dto.OfficerTermResponse
import kr.savien.Praesidium.dto.PositionOptionResponse
import kr.savien.Praesidium.service.OfficerTermService
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.DeleteMapping
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.PutMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.ResponseStatus
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api")
class OfficerTermController(private val officerTermService: OfficerTermService) {

    @GetMapping("/positions")
    fun positions(): List<PositionOptionResponse> = officerTermService.listPositionOptions()

    @GetMapping("/members")
    fun members(): List<MemberOptionResponse> = officerTermService.listMemberOptions()

    @GetMapping("/officer-terms")
    fun list(): List<OfficerTermResponse> = officerTermService.listOfficerTerms()

    @PostMapping("/officer-terms")
    @ResponseStatus(HttpStatus.CREATED)
    fun create(@RequestBody request: OfficerTermRequest): OfficerTermResponse =
        officerTermService.create(request)

    @PutMapping("/officer-terms/{id}")
    fun update(@PathVariable id: Int, @RequestBody request: OfficerTermRequest): OfficerTermResponse =
        officerTermService.update(id, request)

    @DeleteMapping("/officer-terms/{id}")
    fun delete(@PathVariable id: Int): ResponseEntity<Void> {
        officerTermService.delete(id)
        return ResponseEntity.noContent().build()
    }
}
