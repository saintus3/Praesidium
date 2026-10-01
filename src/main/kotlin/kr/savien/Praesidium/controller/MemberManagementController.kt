package kr.savien.Praesidium.controller

import kr.savien.Praesidium.dto.MemberManagementRequest
import kr.savien.Praesidium.dto.MemberManagementResponse
import kr.savien.Praesidium.service.MemberManagementService
import org.springframework.http.HttpHeaders
import org.springframework.http.HttpStatus
import org.springframework.http.MediaType
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.DeleteMapping
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.PutMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.ResponseStatus
import org.springframework.web.bind.annotation.RestController
import org.springframework.web.multipart.MultipartFile

@RestController
@RequestMapping("/api/member-management")
class MemberManagementController(private val memberManagementService: MemberManagementService) {

    @GetMapping
    fun list(): List<MemberManagementResponse> = memberManagementService.list()

    @GetMapping("/{id}/photo")
    fun photo(@PathVariable id: Int): ResponseEntity<ByteArray> {
        val (bytes, contentType) = memberManagementService.getPhoto(id)
        return ResponseEntity.ok()
            .header(HttpHeaders.CONTENT_TYPE, contentType)
            .body(bytes)
    }

    @PostMapping(consumes = [MediaType.MULTIPART_FORM_DATA_VALUE])
    @ResponseStatus(HttpStatus.CREATED)
    fun create(
        @RequestParam name: String,
        @RequestParam baptismalName: String,
        @RequestParam(required = false, defaultValue = "") phone: String,
        @RequestParam(required = false, defaultValue = "") address: String,
        @RequestParam(required = false, defaultValue = "true") active: Boolean,
        @RequestParam(required = false) joinedOn: String?,
        @RequestParam(required = false) leftOn: String?,
        @RequestParam(required = false) photo: MultipartFile?
    ): MemberManagementResponse =
        memberManagementService.create(
            MemberManagementRequest(name, baptismalName, phone, address, active, joinedOn, leftOn),
            photo
        )

    @PutMapping("/{id}", consumes = [MediaType.MULTIPART_FORM_DATA_VALUE])
    fun update(
        @PathVariable id: Int,
        @RequestParam name: String,
        @RequestParam baptismalName: String,
        @RequestParam(required = false, defaultValue = "") phone: String,
        @RequestParam(required = false, defaultValue = "") address: String,
        @RequestParam(required = false, defaultValue = "true") active: Boolean,
        @RequestParam(required = false) joinedOn: String?,
        @RequestParam(required = false) leftOn: String?,
        @RequestParam(required = false) photo: MultipartFile?
    ): MemberManagementResponse =
        memberManagementService.update(
            id,
            MemberManagementRequest(name, baptismalName, phone, address, active, joinedOn, leftOn),
            photo
        )

    @DeleteMapping("/{id}")
    fun delete(@PathVariable id: Int): ResponseEntity<Void> {
        memberManagementService.delete(id)
        return ResponseEntity.noContent().build()
    }
}
