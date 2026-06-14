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
    val time: String,
    /** true = cambio aplicado de forma optimista en el reloj, aun no confirmado
     *  por el movil. Se muestra marcado como pendiente hasta el ACK/STATUS, que
     *  lo reconcilia (lo sustituye por el dato real) o lo revierte. */
    val pendiente: Boolean = false
)

data class WatchTurnoTotals(
    val porTipo: Map<String, Double>,
    val numPorTipo: Map<String, Int>,
    val numEntradas: Int
)

data class WatchTurno(
    val id: Long,
    val date: String,
    val startDate: String,
    val startTime: String,
    val endTime: String,
    val dinero: Double,
    val km: Double,
    val totalTaximetro: Double,
    val miGanancia: Double,
    val totalADescontar: Double,
    val totalADar: Double,
    /** true = la app movil aun no ha calculado la contabilidad de este turno
     *  (p. ej. cerrado desde el reloj con la app cerrada). Mostrar "Pendiente". */
    val contablePendiente: Boolean = false,
    val tiempoTrabajado: String,
    val totals: WatchTurnoTotals,
    val entradas: List<WatchEntry>
)

/** Metadatos visuales de una categoría: etiqueta, color de texto y color de fondo. */
data class CategoriaMeta(
    val label: String,
    val color: Color,
    val bg: Color,
    val border: Color
)

fun categoriaMeta(type: String): CategoriaMeta = when (type) {
    "propina" -> CategoriaMeta("Propinas", ColorPropina, ColorPropinaBg, ColorPropina.copy(alpha = 0.20f))
    "datafono" -> CategoriaMeta("Datáfono", ColorDatafono, ColorDatafonoBg, ColorDatafono.copy(alpha = 0.20f))
    "agencia_bono" -> CategoriaMeta("Agencias/Bonos", ColorAgencia, ColorAgenciaBg, ColorAgencia.copy(alpha = 0.20f))
    "extra" -> CategoriaMeta("Extras", ColorExtra, ColorExtraBg, ColorExtra.copy(alpha = 0.20f))
    "gasolina" -> CategoriaMeta("Gasolina", ColorGasolina, ColorGasolinaBg, ColorGasolina.copy(alpha = 0.20f))
    "nulo" -> CategoriaMeta("Nulos", ColorNulo, ColorNuloBg, ColorNulo.copy(alpha = 0.20f))
    "nota" -> CategoriaMeta("Nota", ColorWhite, ColorNuloBg, ColorWhite.copy(alpha = 0.20f))
    else -> CategoriaMeta(type, ColorWhite, ColorNuloBg, ColorWhite.copy(alpha = 0.20f))
}

data class CardVisualStyle(
    val color: Color,
    val bg: Color,
    val border: Color
)

fun metricCardStyle(type: String): CardVisualStyle = when (type) {
    "taximetro" -> CardVisualStyle(ColorTaximetro, ColorTaximetroBg, ColorTaximetroBorder)
    "ganancia" -> CardVisualStyle(ColorGanancia, ColorGananciaBg, ColorGananciaBorder)
    "km" -> CardVisualStyle(ColorKm, ColorKmBg, ColorKmBorder)
    "tiempo" -> CardVisualStyle(ColorTiempo, ColorTiempoBg, ColorTiempoBorder)
    "descontar" -> CardVisualStyle(ColorGasolina, ColorGasolinaBg, ColorGasolina.copy(alpha = 0.35f))
    "dar" -> CardVisualStyle(ColorPropina, ColorPropinaBg, ColorPropina.copy(alpha = 0.35f))
    else -> CardVisualStyle(ColorWhite, ColorNuloBg, ColorWhite.copy(alpha = 0.20f))
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

/** Convierte "2026-06-01" en "Lun, 1 jun 2026". Si falla, devuelve el original. */
fun formatFechaResumen(iso: String): String {
    if (iso.isBlank()) return ""
    return try {
        val date = java.time.LocalDate.parse(iso)
        val fmt = java.time.format.DateTimeFormatter.ofPattern("EEE, d MMM yyyy", esES)
        date.format(fmt).replaceFirstChar { it.uppercase(esES) }
    } catch (e: Exception) {
        iso
    }
}
