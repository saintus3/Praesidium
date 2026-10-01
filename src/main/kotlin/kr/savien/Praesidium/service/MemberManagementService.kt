package kr.savien.Praesidium.service

import kr.savien.Praesidium.domain.Member
import kr.savien.Praesidium.dto.MemberManagementRequest
import kr.savien.Praesidium.dto.MemberManagementResponse
import kr.savien.Praesidium.repository.AttendanceRepository
import kr.savien.Praesidium.repository.MemberRepository
import kr.savien.Praesidium.repository.OfficerTermRepository
import org.springframework.dao.DataIntegrityViolationException
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import org.springframework.web.multipart.MultipartFile
import org.springframework.web.server.ResponseStatusException

@Service
@Transactional(readOnly = true)
class MemberManagementService(
    private val memberRepository: MemberRepository,
    private val officerTermRepository: OfficerTermRepository,
    private val attendanceRepository: AttendanceRepository
) {

    fun list(): List<MemberManagementResponse> {
        val currentPositionByMemberId = officerTermRepository.findAllCurrentWithPosition()
            .groupBy { it.member.id }
            .mapValues { (_, terms) -> terms.first().position.name }

        return memberRepository.findAllByOrderByNameAsc().map {
            it.toResponse(currentPositionByMemberId[it.id])
        }
    }

    fun getPhoto(id: Int): Pair<ByteArray, String> {
        val member = memberRepository.findById(id)
            .orElseThrow { ResponseStatusException(HttpStatus.NOT_FOUND, "단원을 찾을 수 없습니다. (id=$id)") }
        val photo = member.photo
            ?: throw ResponseStatusException(HttpStatus.NOT_FOUND, "등록된 사진이 없습니다. (id=$id)")
        return photo to (member.photoType ?: "application/octet-stream")
    }

    @Transactional
    fun create(request: MemberManagementRequest, photo: MultipartFile?): MemberManagementResponse {
        validate(request)
        val (photoBytes, photoType) = resolvePhoto(photo)

        val saved = memberRepository.save(
            Member(
                name = request.name.trim(),
                baptismalName = request.baptismalName.trim(),
                phone = request.phone.trim(),
                address = request.address.trim(),
                active = if (request.active) 1 else 0,
                joinedOn = request.joinedOn,
                leftOn = request.leftOn,
                photo = photoBytes,
                photoType = photoType
            )
        )
        return saved.toResponse(null)
    }

    @Transactional
    fun update(id: Int, request: MemberManagementRequest, photo: MultipartFile?): MemberManagementResponse {
        val existing = memberRepository.findById(id)
            .orElseThrow { ResponseStatusException(HttpStatus.NOT_FOUND, "단원을 찾을 수 없습니다. (id=$id)") }
        validate(request)

        val (photoBytes, photoType) = resolvePhoto(photo)

        val updated = memberRepository.save(
            Member(
                id = existing.id,
                name = request.name.trim(),
                baptismalName = request.baptismalName.trim(),
                phone = request.phone.trim(),
                address = request.address.trim(),
                active = if (request.active) 1 else 0,
                joinedOn = request.joinedOn,
                leftOn = request.leftOn,
                photo = photoBytes ?: existing.photo,
                photoType = photoType ?: existing.photoType
            )
        )

        val currentPositionName = officerTermRepository.findAllCurrentWithPosition()
            .firstOrNull { it.member.id == id }?.position?.name
        return updated.toResponse(currentPositionName)
    }

    @Transactional
    fun delete(id: Int) {
        if (!memberRepository.existsById(id)) {
            throw ResponseStatusException(HttpStatus.NOT_FOUND, "단원을 찾을 수 없습니다. (id=$id)")
        }
        if (officerTermRepository.existsByMember_Id(id) || attendanceRepository.existsByMember_Id(id)) {
            throw ResponseStatusException(
                HttpStatus.CONFLICT,
                "간부임기 또는 출석 기록이 있는 단원은 삭제할 수 없습니다. 먼저 관련 기록을 정리해주세요."
            )
        }
        try {
            memberRepository.deleteById(id)
        } catch (ex: DataIntegrityViolationException) {
            throw ResponseStatusException(HttpStatus.CONFLICT, "다른 데이터와 연결되어 있어 삭제할 수 없습니다.")
        }
    }

    private fun resolvePhoto(photo: MultipartFile?): Pair<ByteArray?, String?> {
        if (photo == null || photo.isEmpty) return null to null
        return photo.bytes to (photo.contentType ?: "application/octet-stream")
    }

    private fun validate(request: MemberManagementRequest) {
        if (request.name.isBlank()) {
            throw ResponseStatusException(HttpStatus.BAD_REQUEST, "이름은 필수입니다.")
        }
        if (request.baptismalName.isBlank()) {
            throw ResponseStatusException(HttpStatus.BAD_REQUEST, "세례명은 필수입니다.")
        }
        if (!request.joinedOn.isNullOrBlank() && !request.leftOn.isNullOrBlank() && request.leftOn < request.joinedOn) {
            throw ResponseStatusException(HttpStatus.BAD_REQUEST, "탈퇴일은 입단일보다 빠를 수 없습니다.")
        }
    }

    private fun Member.toResponse(positionName: String?) = MemberManagementResponse(
        id = id,
        name = name,
        baptismalName = baptismalName,
        phone = phone,
        address = address,
        active = active == 1,
        joinedOn = joinedOn,
        leftOn = leftOn,
        positionName = positionName,
        hasPhoto = photo != null
    )
}
