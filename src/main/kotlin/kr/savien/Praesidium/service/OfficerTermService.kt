package kr.savien.Praesidium.service

import kr.savien.Praesidium.domain.OfficerTerm
import kr.savien.Praesidium.dto.MemberOptionResponse
import kr.savien.Praesidium.dto.OfficerTermRequest
import kr.savien.Praesidium.dto.OfficerTermResponse
import kr.savien.Praesidium.dto.PositionOptionResponse
import kr.savien.Praesidium.repository.MemberRepository
import kr.savien.Praesidium.repository.OfficerTermRepository
import kr.savien.Praesidium.repository.PositionRepository
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import org.springframework.web.server.ResponseStatusException

@Service
@Transactional(readOnly = true)
class OfficerTermService(
    private val officerTermRepository: OfficerTermRepository,
    private val positionRepository: PositionRepository,
    private val memberRepository: MemberRepository
) {

    fun listPositionOptions(): List<PositionOptionResponse> =
        positionRepository.findAllByOrderBySortOrderAsc().map {
            PositionOptionResponse(it.id, it.code, it.name)
        }

    fun listMemberOptions(): List<MemberOptionResponse> =
        memberRepository.findAllByOrderByNameAsc().map {
            MemberOptionResponse(it.id, it.name, it.baptismalName, it.active == 1)
        }

    fun listOfficerTerms(): List<OfficerTermResponse> =
        officerTermRepository.findAllWithDetails().map { it.toResponse() }

    @Transactional
    fun create(request: OfficerTermRequest): OfficerTermResponse {
        val position = findPosition(request.positionId)
        val member = findMember(request.memberId)
        validateDates(request.startedOn, request.endedOn)

        val saved = officerTermRepository.save(
            OfficerTerm(
                position = position,
                member = member,
                startedOn = request.startedOn,
                endedOn = request.endedOn
            )
        )
        return saved.toResponse()
    }

    @Transactional
    fun update(id: Int, request: OfficerTermRequest): OfficerTermResponse {
        val officerTerm = officerTermRepository.findById(id)
            .orElseThrow { ResponseStatusException(HttpStatus.NOT_FOUND, "간부임기를 찾을 수 없습니다. (id=$id)") }

        validateDates(request.startedOn, request.endedOn)

        officerTerm.position = findPosition(request.positionId)
        officerTerm.member = findMember(request.memberId)
        officerTerm.startedOn = request.startedOn
        officerTerm.endedOn = request.endedOn

        return officerTermRepository.save(officerTerm).toResponse()
    }

    @Transactional
    fun delete(id: Int) {
        if (!officerTermRepository.existsById(id)) {
            throw ResponseStatusException(HttpStatus.NOT_FOUND, "간부임기를 찾을 수 없습니다. (id=$id)")
        }
        officerTermRepository.deleteById(id)
    }

    private fun findPosition(id: Int) =
        positionRepository.findById(id)
            .orElseThrow { ResponseStatusException(HttpStatus.BAD_REQUEST, "존재하지 않는 직책입니다. (id=$id)") }

    private fun findMember(id: Int) =
        memberRepository.findById(id)
            .orElseThrow { ResponseStatusException(HttpStatus.BAD_REQUEST, "존재하지 않는 단원입니다. (id=$id)") }

    private fun validateDates(startedOn: String, endedOn: String?) {
        if (startedOn.isBlank()) {
            throw ResponseStatusException(HttpStatus.BAD_REQUEST, "시작일은 필수입니다.")
        }
        if (!endedOn.isNullOrBlank() && endedOn < startedOn) {
            throw ResponseStatusException(HttpStatus.BAD_REQUEST, "종료일은 시작일보다 빠를 수 없습니다.")
        }
    }

    private fun OfficerTerm.toResponse() = OfficerTermResponse(
        id = id,
        positionId = position.id,
        positionName = position.name,
        memberId = member.id,
        memberName = member.name,
        memberBaptismalName = member.baptismalName,
        startedOn = startedOn,
        endedOn = endedOn
    )
}
