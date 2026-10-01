package kr.savien.Praesidium.domain

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.GeneratedValue
import jakarta.persistence.GenerationType
import jakarta.persistence.Id
import jakarta.persistence.Lob
import jakarta.persistence.Table

@Entity
@Table(name = "members")
class Member(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Int = 0,

    @Column(name = "name", nullable = false, length = 100)
    val name: String = "",

    @Column(name = "baptismal_name", nullable = false, length = 100)
    val baptismalName: String = "",

    @Column(name = "phone", nullable = false, length = 50)
    val phone: String = "",

    @Column(name = "address", nullable = false, length = 255)
    val address: String = "",

    // DB column is tinyint(4); columnDefinition keeps Hibernate schema validation aligned with the actual type.
    @Column(name = "active", nullable = false, columnDefinition = "tinyint")
    val active: Int = 1,

    @Column(name = "joined_on", length = 20)
    val joinedOn: String? = null,

    @Column(name = "left_on", length = 20)
    val leftOn: String? = null,

    @Lob
    @Column(name = "photo", columnDefinition = "longblob")
    val photo: ByteArray? = null,

    @Column(name = "photo_type", length = 100)
    val photoType: String? = null
)
