package kr.savien.Praesidium.domain

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.GeneratedValue
import jakarta.persistence.GenerationType
import jakarta.persistence.Id
import jakarta.persistence.Table

@Entity
@Table(name = "meetings")
class Meeting(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Int = 0,

    @Column(name = "meeting_date", nullable = false, length = 20)
    val meetingDate: String = "",

    @Column(name = "sequence")
    val sequence: Int? = null,

    @Column(name = "notes", nullable = false)
    val notes: String = ""
)
