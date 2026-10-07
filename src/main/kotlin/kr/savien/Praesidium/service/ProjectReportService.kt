package kr.savien.Praesidium.service

import kr.savien.Praesidium.dto.ProjectReportActivity
import kr.savien.Praesidium.dto.ProjectReportActivityCategory
import kr.savien.Praesidium.dto.ProjectReportEvent
import kr.savien.Praesidium.dto.ProjectReportResponse
import kr.savien.Praesidium.repository.ActivityCountRepository
import kr.savien.Praesidium.repository.ActivityTypeRepository
import kr.savien.Praesidium.repository.MeetingRepository
import kr.savien.Praesidium.repository.ScheduleEventRepository
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import org.springframework.web.server.ResponseStatusException
import java.time.LocalDate

@Service
@Transactional(readOnly = true)
class ProjectReportService(
    private val monthlyReportService: MonthlyReportService,
    private val activityCountRepository: ActivityCountRepository,
    private val activityTypeRepository: ActivityTypeRepository,
    private val meetingRepository: MeetingRepository,
    private val scheduleEventRepository: ScheduleEventRepository
) {

    fun availableYears(): List<Int> =
        (monthlyReportService.availableMonths()
            .map { it.substringBefore('-').toInt() }
            .toSet() + scheduleEventRepository.findAllByOrderByEventDateAsc()
            .mapNotNull { parseFlexibleDate(it.eventDate)?.year })
            .sortedDescending()

    fun report(year: Int): ProjectReportResponse {
        if (year !in 1000..9999) {
            throw ResponseStatusException(HttpStatus.BAD_REQUEST, "연도 형식이 올바르지 않습니다. (year=$year)")
        }

        val availableMonths = monthlyReportService.availableMonths().toSet()
        val monthlyReports = (1..12).mapNotNull { month ->
            val yearMonth = "%04d-%02d".format(year, month)
            if (yearMonth in availableMonths) {
                monthlyReportService.report(yearMonth)
            } else {
                null
            }
        }

        val meetingIdsForYear = meetingRepository.findAll()
            .filter { parseFlexibleDate(it.meetingDate)?.year == year }
            .map { it.id }
        val countByTypeId = if (meetingIdsForYear.isEmpty()) {
            emptyMap()
        } else {
            activityCountRepository.findAllByMeeting_IdIn(meetingIdsForYear)
                .groupBy { it.activityType.id }
                .mapValues { (_, counts) -> counts.sumOf { it.count } }
        }

        val activityCategories = activityTypeRepository.findAllWithCategory()
            .groupBy { it.category }
            .map { (category, types) ->
                val activities = types.map { type ->
                    ProjectReportActivity(
                        name = type.name,
                        count = countByTypeId[type.id] ?: 0,
                        unit = type.unit
                    )
                }
                ProjectReportActivityCategory(
                    name = category.name,
                    total = activities.sumOf { it.count },
                    activities = activities
                )
            }

        val legioEvents = scheduleEventRepository.findAllByOrderByEventDateAsc()
            .filter { event ->
                parseFlexibleDate(event.eventDate)?.year == year &&
                    (event.title.contains(LEGIO_EVENT_MARKER) ||
                        event.detail?.contains(LEGIO_EVENT_MARKER) == true)
            }
            .sortedBy { parseFlexibleDate(it.eventDate) ?: LocalDate.MAX }
            .map { event ->
                val cleanTitle = event.title.replace(LEGIO_EVENT_MARKER, "").trim()
                ProjectReportEvent(
                    date = event.eventDate,
                    name = cleanTitle.ifBlank { event.title },
                    place = event.detail?.takeIf { it.isNotBlank() }
                )
            }

        val carryOverAmount = monthlyReports
            .firstOrNull { it.yearMonth == "%04d-01".format(year) }
            ?.carryOverAmount ?: 0L
        val incomeTotal = monthlyReports.sumOf { it.incomeTotal }
        val expenseTotal = monthlyReports.sumOf { it.expenseTotal }

        return ProjectReportResponse(
            year = year,
            officerPresent = monthlyReports.sumOf { it.officerPresent },
            officerTotal = monthlyReports.sumOf { it.officerTotal },
            memberPresent = monthlyReports.sumOf { it.memberPresent },
            memberTotal = monthlyReports.sumOf { it.memberTotal },
            carryOverAmount = carryOverAmount,
            incomeTotal = incomeTotal,
            expenseTotal = expenseTotal,
            balance = carryOverAmount + incomeTotal - expenseTotal,
            activityCategories = activityCategories,
            legioEvents = legioEvents
        )
    }

    private fun parseFlexibleDate(value: String): LocalDate? {
        val parts = value.split('-', '.').map { it.trim() }
        if (parts.size != 3) return null
        return try {
            LocalDate.of(parts[0].toInt(), parts[1].toInt(), parts[2].toInt())
        } catch (_: Exception) {
            null
        }
    }

    companion object {
        private const val LEGIO_EVENT_MARKER = "[레지오행사]"
    }
}
