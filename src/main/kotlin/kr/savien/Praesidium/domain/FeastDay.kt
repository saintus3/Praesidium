package kr.savien.Praesidium.domain

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.GeneratedValue
import jakarta.persistence.GenerationType
import jakarta.persistence.Id
import jakarta.persistence.Table

@Entity
@Table(name = "feast_days")
class FeastDay(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Int = 0,

    @Column(name = "name", nullable = false, length = 100)
    val name: String = "",

    @Column(name = "full_name", nullable = false, length = 200)
    val fullName: String = "",

    @Column(name = "month", nullable = false)
    val month: Int = 0,

    @Column(name = "day", nullable = false)
    val day: Int = 0,

    @Column(name = "gender", nullable = false, length = 10)
    val gender: String = "",

    @Column(name = "note", nullable = false)
    val note: String = ""
)
