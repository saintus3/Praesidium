package kr.savien.Praesidium.domain

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.FetchType
import jakarta.persistence.GeneratedValue
import jakarta.persistence.GenerationType
import jakarta.persistence.Id
import jakarta.persistence.JoinColumn
import jakarta.persistence.ManyToOne
import jakarta.persistence.Table

@Entity
@Table(name = "activity_types")
class ActivityType(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Int = 0,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id", nullable = false)
    var category: ActivityCategory = ActivityCategory(),

    @Column(name = "name", nullable = false, length = 200)
    var name: String = "",

    @Column(name = "short_name", length = 50)
    var shortName: String? = null,

    @Column(name = "unit", nullable = false, length = 20)
    var unit: String = "회",

    @Column(name = "sort_order", nullable = false)
    var sortOrder: Int = 0,

    @Column(name = "sheet_order")
    var sheetOrder: Int? = null,

    // DB column is tinyint(4); columnDefinition keeps Hibernate schema validation aligned with the actual type.
    @Column(name = "active", nullable = false, columnDefinition = "tinyint")
    var active: Int = 1,

    @Column(name = "description", length = 100)
    var description: String? = null
)
