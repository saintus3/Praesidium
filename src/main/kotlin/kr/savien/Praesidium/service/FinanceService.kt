package kr.savien.Praesidium.service

import kr.savien.Praesidium.domain.Finance
import kr.savien.Praesidium.dto.FinanceItemRequest
import kr.savien.Praesidium.dto.FinanceItemResponse
import kr.savien.Praesidium.dto.FinanceSummaryResponse
import kr.savien.Praesidium.repository.FinanceRepository
import kr.savien.Praesidium.repository.MeetingRepository
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import org.springframework.web.server.ResponseStatusException

@Service
@Transactional
class FinanceService(
    private val financeRepository: FinanceRepository,
    private val meetingRepository: MeetingRepository
) {

    companion object {
        const val CARRY_OVER_NAME = "지지난주 비밀헌금"
        const val DEFAULT_INCOME_NAME = "지난주 비밀헌금"
        const val DEFAULT_EXPENSE_NAME = "꽃값"
        private const val INCOME = "INCOME"
        private const val EXPENSE = "EXPENSE"
    }

    fun list(meetingId: Int): FinanceSummaryResponse {
        requireMeeting(meetingId)
        val items = ensureDefaults(meetingId)
        return toSummary(items)
    }

    fun create(meetingId: Int, request: FinanceItemRequest): FinanceSummaryResponse {
        val meeting = requireMeeting(meetingId)
        ensureDefaults(meetingId)
        validate(request)
        if (request.description.trim() == CARRY_OVER_NAME) {
            throw ResponseStatusException(HttpStatus.BAD_REQUEST, "'$CARRY_OVER_NAME' 항목명은 자동 계산 항목 전용입니다.")
        }
        financeRepository.save(
            Finance(
                meeting = meeting,
                kind = request.kind,
                description = request.description.trim(),
                amount = request.amount
            )
        )
        return toSummary(financeRepository.findAllByMeeting_IdOrderByIdAsc(meetingId))
    }

    fun update(meetingId: Int, itemId: Int, request: FinanceItemRequest): FinanceSummaryResponse {
        requireMeeting(meetingId)
        val existing = financeRepository.findById(itemId)
            .orElseThrow { ResponseStatusException(HttpStatus.NOT_FOUND, "회계항목을 찾을 수 없습니다. (id=$itemId)") }
        if (existing.meeting.id != meetingId) {
            throw ResponseStatusException(HttpStatus.BAD_REQUEST, "해당 회차의 회계항목이 아닙니다.")
        }
        validate(request)
        financeRepository.save(
            Finance(
                id = existing.id,
                meeting = existing.meeting,
                kind = request.kind,
                description = request.description.trim(),
                amount = request.amount
            )
        )
        return toSummary(financeRepository.findAllByMeeting_IdOrderByIdAsc(meetingId))
    }

    fun delete(meetingId: Int, itemId: Int): FinanceSummaryResponse {
        requireMeeting(meetingId)
        val existing = financeRepository.findById(itemId)
            .orElseThrow { ResponseStatusException(HttpStatus.NOT_FOUND, "회계항목을 찾을 수 없습니다. (id=$itemId)") }
        if (existing.meeting.id != meetingId) {
            throw ResponseStatusException(HttpStatus.BAD_REQUEST, "해당 회차의 회계항목이 아닙니다.")
        }
        financeRepository.delete(existing)
        return toSummary(financeRepository.findAllByMeeting_IdOrderByIdAsc(meetingId))
    }

    private fun requireMeeting(meetingId: Int) =
        meetingRepository.findById(meetingId)
            .orElseThrow { ResponseStatusException(HttpStatus.NOT_FOUND, "회차를 찾을 수 없습니다. (id=$meetingId)") }

    private fun validate(request: FinanceItemRequest) {
        if (request.kind != INCOME && request.kind != EXPENSE) {
            throw ResponseStatusException(HttpStatus.BAD_REQUEST, "구분은 수입(INCOME) 또는 지출(EXPENSE)이어야 합니다.")
        }
        if (request.description.isBlank()) {
            throw ResponseStatusException(HttpStatus.BAD_REQUEST, "항목명은 필수입니다.")
        }
    }

    /** 회차 정렬 순서(최신순) 중에서 현재 회차 바로 다음(=시간상 이전) 회차를 찾는다. */
    private fun previousMeetingId(meetingId: Int): Int? {
        val ordered = meetingRepository.findAllByOrderBySequenceDescMeetingDateDesc()
        val idx = ordered.indexOfFirst { it.id == meetingId }
        if (idx == -1 || idx == ordered.size - 1) return null
        return ordered[idx + 1].id
    }

    /** 해당 회차의 수입/지출 항목이 비어있으면 기본 항목(지지난주/지난주 비밀헌금, 꽃값)을 생성한다.
     *  '지지난주 비밀헌금'은 최초 생성 시에만 이전 회차의 잔액으로 자동 채워지며, 이후에는 사용자가 직접 수정할 수 있다. */
    private fun ensureDefaults(meetingId: Int): List<Finance> {
        var items = financeRepository.findAllByMeeting_IdOrderByIdAsc(meetingId)

        if (items.isEmpty()) {
            val previousId = previousMeetingId(meetingId)
            val carryAmount = if (previousId != null) balanceOf(ensureDefaults(previousId)) else 0L
            val meeting = meetingRepository.getReferenceById(meetingId)
            financeRepository.save(
                Finance(meeting = meeting, kind = INCOME, description = CARRY_OVER_NAME, amount = carryAmount.toInt())
            )
            financeRepository.save(
                Finance(meeting = meeting, kind = INCOME, description = DEFAULT_INCOME_NAME, amount = 0)
            )
            financeRepository.save(
                Finance(meeting = meeting, kind = EXPENSE, description = DEFAULT_EXPENSE_NAME, amount = 0)
            )
            items = financeRepository.findAllByMeeting_IdOrderByIdAsc(meetingId)
        } else if (items.none { it.description == CARRY_OVER_NAME }) {
            val previousId = previousMeetingId(meetingId)
            val carryAmount = if (previousId != null) balanceOf(ensureDefaults(previousId)) else 0L
            val meeting = meetingRepository.getReferenceById(meetingId)
            financeRepository.save(
                Finance(meeting = meeting, kind = INCOME, description = CARRY_OVER_NAME, amount = carryAmount.toInt())
            )
            items = financeRepository.findAllByMeeting_IdOrderByIdAsc(meetingId)
        }
        return items
    }

    private fun balanceOf(items: List<Finance>): Long {
        val income = items.filter { it.kind == INCOME }.sumOf { it.amount.toLong() }
        val expense = items.filter { it.kind == EXPENSE }.sumOf { it.amount.toLong() }
        return income - expense
    }

    private fun toSummary(items: List<Finance>): FinanceSummaryResponse {
        val responses = items.map {
            FinanceItemResponse(
                id = it.id,
                kind = it.kind,
                description = it.description,
                amount = it.amount,
                editable = true,
                deletable = true
            )
        }
        val totalIncome = items.filter { it.kind == INCOME }.sumOf { it.amount.toLong() }
        val totalExpense = items.filter { it.kind == EXPENSE }.sumOf { it.amount.toLong() }
        return FinanceSummaryResponse(
            items = responses,
            totalIncome = totalIncome,
            totalExpense = totalExpense,
            balance = totalIncome - totalExpense
        )
    }
}
