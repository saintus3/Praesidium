package kr.savien.Praesidium.service

import kr.savien.Praesidium.domain.ActivityType
import kr.savien.Praesidium.dto.ActivityTypeResponse
import kr.savien.Praesidium.repository.ActivityTypeRepository
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
@Transactional(readOnly = true)
class ActivityItemManagementService(
    private val activityTypeRepository: ActivityTypeRepository
) {

    fun list(): List<ActivityTypeResponse> =
        activityTypeRepository.findAllWithCategory().map { it.toResponse() }

    private fun ActivityType.toResponse() = ActivityTypeResponse(
        id = id,
        categoryId = category.id,
        categoryName = category.name,
        name = name,
        shortName = shortName,
        unit = unit
    )
}
