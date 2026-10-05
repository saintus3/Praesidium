package kr.savien.Praesidium.controller

import org.springframework.core.io.Resource
import org.springframework.core.io.support.PathMatchingResourcePatternResolver
import org.springframework.http.ContentDisposition
import org.springframework.http.HttpHeaders
import org.springframework.http.HttpStatus
import org.springframework.http.MediaType
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.RestController
import org.springframework.web.server.ResponseStatusException
import java.nio.charset.StandardCharsets

@RestController
class CatholicSongController {

    private val songsByNumber: Map<Int, Resource> by lazy {
        PathMatchingResourcePatternResolver()
            .getResources("classpath*:static/docs/gatholic_song/**/*.pdf")
            .mapNotNull { resource ->
                val filename = resource.filename ?: return@mapNotNull null
                val number = SONG_FILENAME.matchEntire(filename)
                    ?.groupValues
                    ?.get(1)
                    ?.toIntOrNull()
                    ?: return@mapNotNull null
                number to resource
            }
            .sortedBy { it.second.filename }
            .groupBy({ it.first }, { it.second })
            .mapValues { (_, resources) -> resources.first() }
    }

    @GetMapping("/api/catholic-songs/{number}")
    fun getSong(@PathVariable number: Int): ResponseEntity<Resource> {
        if (number !in 1..500) {
            throw ResponseStatusException(HttpStatus.BAD_REQUEST, "성가번호는 1부터 500까지 입력해 주세요.")
        }

        val resource = songsByNumber[number]
            ?: throw ResponseStatusException(HttpStatus.NOT_FOUND, "해당 성가 PDF를 찾을 수 없습니다.")
        val filename = resource.filename ?: "$number.pdf"
        val headers = HttpHeaders().apply {
            contentType = MediaType.APPLICATION_PDF
            contentDisposition = ContentDisposition.inline()
                .filename(filename, StandardCharsets.UTF_8)
                .build()
        }
        return ResponseEntity.ok().headers(headers).body(resource)
    }

    companion object {
        private val SONG_FILENAME = Regex("^0*(\\d+)\\..*\\.pdf$", RegexOption.IGNORE_CASE)
    }
}
