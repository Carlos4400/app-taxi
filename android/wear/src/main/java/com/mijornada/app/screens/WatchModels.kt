package com.mijornada.app.screens

import androidx.compose.ui.graphics.Color
import com.mijornada.app.theme.*
import java.util.Locale

/** Una entrada del turno recibida del móvil. */
data class WatchEntry(
    val id: Long,
    val type: String,
    val amount: Double,
    val note: String,
    val time: String
)

/** Metadatos visuales de una categoría: etiqueta, color de texto y color de fondo. */
data class CategoriaMeta(
    val label: String,
    val color: Color,
    val bg: Color
)

fun categoriaMeta(type: String): CategoriaMeta = when (type) {
    "propina" -> CategoriaMeta("Propinas", ColorPropina, ColorPropinaBg)
    "datafono" -> CategoriaMeta("Datáfono", ColorDatafono, ColorDatafonoBg)
    "agencia_bono" -> CategoriaMeta("Agencias", ColorAgencia, ColorAgenciaBg)
    "extra" -> CategoriaMeta("Extras", ColorExtra, ColorExtraBg)
    "gasolina" -> CategoriaMeta("Gasolina", ColorGasolina, ColorGasolinaBg)
    "nulo" -> CategoriaMeta("Nulos", ColorNulo, ColorNuloBg)
    "nota" -> CategoriaMeta("Nota", ColorWhite, ColorNuloBg)
    else -> CategoriaMeta(type, ColorWhite, ColorNuloBg)
}

/** Etiqueta en singular para la cabecera del teclado al añadir/editar. */
fun categoriaLabelSingular(type: String): String = when (type) {
    "propina" -> "Propina"
    "datafono" -> "Datáfono"
    "agencia_bono" -> "Agencia/Bono"
    "extra" -> "Extra"
    "gasolina" -> "Gasolina"
    "nulo" -> "Nulo"
    "nota" -> "Nota"
    else -> type
}

private val esES = Locale("es", "ES")

/** Formatea un importe en euros estilo español: 8,00€ / 96,55€ */
fun fmtEur(v: Double): String = String.format(esES, "%.2f€", v)

/** Importe con signo para el historial: +1,70 € */
fun fmtEurSigned(v: Double): String = "+" + String.format(esES, "%.2f €", v)

/** Convierte "2026-06-01" en "Lunes, 1 de junio". Si falla, devuelve el original. */
fun formatFechaTurno(iso: String): String {
    if (iso.isBlank()) return ""
    return try {
        val date = java.time.LocalDate.parse(iso)
        val fmt = java.time.format.DateTimeFormatter.ofPattern("EEEE, d 'de' MMMM", esES)
        date.format(fmt).replaceFirstChar { it.uppercase(esES) }
    } catch (e: Exception) {
        iso
    }
}
