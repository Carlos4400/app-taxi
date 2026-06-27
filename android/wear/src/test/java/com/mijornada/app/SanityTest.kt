package com.mijornada.app

import org.junit.Assert.assertEquals
import org.junit.Test

/**
 * Sanity check de la infraestructura de tests del modulo wear.
 *
 * Verifica que JUnit 4 esta bien configurado y `./gradlew :wear:testDebugUnitTest`
 * es capaz de ejecutar tests locales (sin emulador). Test trivial, siempre verde.
 *
 * Forma parte de la Fase 1 del plan PLAN_FIX_BOTONES_WEAR.md. Sera sustituido
 * por pixel tests reales en commits siguientes.
 */
class SanityTest {
    @Test
    fun junit_is_wired_correctly() {
        assertEquals(2, 1 + 1)
    }
}