package kr.savien.Praesidium.domain

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.GeneratedValue
import jakarta.persistence.GenerationType
import jakarta.persistence.Id
import jakarta.persistence.Table

@Entity
@Table(name = "positions")
class Position(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Int = 0,

    @Column(name = "code", nullable = false, length = 50)
    val code: String = "",

    @Column(name = "name", nullable = false, length = 100)
    val name: String = "",

    // DB column is tinyint(4); columnDefinition keeps Hibernate schema validation aligned with the actual type.
    @Column(name = "officer", nullable = false, columnDefinition = "tinyint")
    val officer: Int = 1,

    @Column(name = "sort_order", nullable = false)
    val sortOrder: Int = 0
)
