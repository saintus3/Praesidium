package kr.savien.Praesidium

import kr.savien.Praesidium.controller.CatholicSongController
import org.junit.jupiter.api.Test
import org.springframework.http.HttpStatus
import org.springframework.http.MediaType
import org.springframework.web.server.ResponseStatusException
import kotlin.test.assertFailsWith
import kotlin.test.assertEquals
import kotlin.test.assertTrue

class CatholicSongControllerTests {

    private val controller = CatholicSongController()

    @Test
    fun `returns the requested song PDF`() {
        val response = controller.getSong(1)

        assertEquals(HttpStatus.OK, response.statusCode)
        assertEquals(MediaType.APPLICATION_PDF, response.headers.contentType)
        assertTrue((response.body?.contentLength() ?: 0L) > 0L)
    }

    @Test
    fun `rejects song numbers outside the supported range`() {
        val error = assertFailsWith<ResponseStatusException> {
            controller.getSong(501)
        }

        assertEquals(HttpStatus.BAD_REQUEST, error.statusCode)
    }
}
