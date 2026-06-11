package com.mijornada.app

import android.app.PendingIntent
import android.content.Intent
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Paint
import android.graphics.RectF
import android.graphics.drawable.Icon
import androidx.wear.watchface.complications.data.ComplicationData
import androidx.wear.watchface.complications.data.ComplicationType
import androidx.wear.watchface.complications.data.PlainComplicationText
import androidx.wear.watchface.complications.data.ShortTextComplicationData
import androidx.wear.watchface.complications.data.SmallImage
import androidx.wear.watchface.complications.data.SmallImageComplicationData
import androidx.wear.watchface.complications.data.SmallImageType
import androidx.wear.watchface.complications.datasource.ComplicationRequest
import androidx.wear.watchface.complications.datasource.SuspendingComplicationDataSourceService

/**
 * Complicación de esfera de Mi Turno.
 *
 * Tipo preferido SMALL_IMAGE: el logo del taxi dentro de un anillo cuyo color
 * indica el estado, coherente con el lenguaje de color de la app:
 *   verde  #3CFF64 = turno activo (verde = acción/ganancia en toda la app)
 *   azul   #3B82F6 = turno en pausa (mismo azul de pausa del móvil)
 *   morado #7C5CFF = libre (morado del botón Turnos, neutro)
 * Se usa SmallImageType.PHOTO para que la esfera no lo tinte y respete los
 * colores. Tocar abre la app. SHORT_TEXT se mantiene para huecos solo-texto.
 */
class TurnoComplicationService : SuspendingComplicationDataSourceService() {

    override fun getPreviewData(type: ComplicationType): ComplicationData? = when (type) {
        ComplicationType.SMALL_IMAGE -> smallImage(COLOR_ACTIVO)
        ComplicationType.SHORT_TEXT -> shortText("13:34", "Turno")
        else -> null
    }

    override suspend fun onComplicationRequest(request: ComplicationRequest): ComplicationData? {
        val status = TurnoStatusStore.read(this)
        return when (request.complicationType) {
            ComplicationType.SMALL_IMAGE -> smallImage(colorEstado(status))
            ComplicationType.SHORT_TEXT -> shortText(textoEstado(status), "Turno")
            else -> null
        }
    }

    private fun colorEstado(status: TurnoStatusStore.Status): Int = when {
        status.activo && status.pausado -> COLOR_PAUSA
        status.activo -> COLOR_ACTIVO
        else -> COLOR_LIBRE
    }

    private fun textoEstado(status: TurnoStatusStore.Status): String = when {
        !status.conocido -> "Abrir"
        status.activo && status.pausado -> "Pausa"
        status.activo && status.startTime.isNotBlank() -> status.startTime
        status.activo -> "Activo"
        else -> "Libre"
    }

    private fun abrirApp(): PendingIntent = PendingIntent.getActivity(
        this,
        0,
        Intent(this, WearMainActivity::class.java),
        PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
    )

    private fun smallImage(colorAnillo: Int): ComplicationData {
        val imagen = SmallImage.Builder(
            Icon.createWithBitmap(logoConAnillo(colorAnillo)),
            SmallImageType.PHOTO,
        ).build()
        return SmallImageComplicationData.Builder(
            imagen,
            PlainComplicationText.Builder("Estado del turno de Mi Turno").build(),
        )
            .setTapAction(abrirApp())
            .build()
    }

    private fun shortText(textoEstado: String, titulo: String): ComplicationData {
        return ShortTextComplicationData.Builder(
            PlainComplicationText.Builder(textoEstado).build(),
            PlainComplicationText.Builder("Estado del turno de Mi Turno").build(),
        )
            .setTitle(PlainComplicationText.Builder(titulo).build())
            .setTapAction(abrirApp())
            .build()
    }

    /** Fondo oscuro de tarjeta + anillo del color del estado + logo centrado. */
    private fun logoConAnillo(colorAnillo: Int): Bitmap {
        val size = 128
        val bmp = Bitmap.createBitmap(size, size, Bitmap.Config.ARGB_8888)
        val canvas = Canvas(bmp)
        val centro = size / 2f

        val fondo = Paint(Paint.ANTI_ALIAS_FLAG).apply {
            color = Color.parseColor("#15151C")
            style = Paint.Style.FILL
        }
        canvas.drawCircle(centro, centro, centro, fondo)

        val grosor = size * 0.075f
        val anillo = Paint(Paint.ANTI_ALIAS_FLAG).apply {
            color = colorAnillo
            style = Paint.Style.STROKE
            strokeWidth = grosor
        }
        canvas.drawCircle(centro, centro, centro - grosor / 2f, anillo)

        val logo = BitmapFactory.decodeResource(resources, R.drawable.brand_taxi_logo)
        if (logo != null) {
            val interior = size * 0.62f
            val ratio = logo.width.toFloat() / logo.height.toFloat()
            val ancho: Float
            val alto: Float
            if (ratio >= 1f) { ancho = interior; alto = interior / ratio } else { alto = interior; ancho = interior * ratio }
            val izq = centro - ancho / 2f
            val arriba = centro - alto / 2f
            canvas.drawBitmap(logo, null, RectF(izq, arriba, izq + ancho, arriba + alto), Paint(Paint.FILTER_BITMAP_FLAG))
        }
        return bmp
    }

    companion object {
        private const val COLOR_ACTIVO = 0xFF3CFF64.toInt()
        private const val COLOR_PAUSA = 0xFF3B82F6.toInt()
        private const val COLOR_LIBRE = 0xFF7C5CFF.toInt()
    }
}
