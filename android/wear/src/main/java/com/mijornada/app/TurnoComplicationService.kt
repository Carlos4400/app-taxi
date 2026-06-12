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
import androidx.wear.watchface.complications.data.MonochromaticImage
import androidx.wear.watchface.complications.data.MonochromaticImageComplicationData
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
 * Decisión del usuario: en la esfera debe verse el logo de la app con
 * "Mi Turno" debajo, sin texto de estado ni hora.
 *
 * - SMALL_IMAGE: el logo neón a color sobre fondo oscuro (PHOTO para que la
 *   esfera no lo tinte). Para huecos que acepten imagen.
 * - SHORT_TEXT: respaldo para huecos solo-texto (como el de la esfera Xiaomi
 *   del usuario, que no acepta SMALL_IMAGE): nombre "Mi Turno" e icono
 *   monocromo del taxi.
 *
 * Tocar abre la app.
 */
class TurnoComplicationService : SuspendingComplicationDataSourceService() {

    override fun getPreviewData(type: ComplicationType): ComplicationData? = when (type) {
        ComplicationType.SMALL_IMAGE -> smallImage()
        ComplicationType.MONOCHROMATIC_IMAGE -> soloIconoCentrado()
        ComplicationType.SHORT_TEXT -> shortTextMiTurno()
        else -> null
    }

    override suspend fun onComplicationRequest(request: ComplicationRequest): ComplicationData? =
        when (request.complicationType) {
            ComplicationType.SMALL_IMAGE -> smallImage()
            ComplicationType.MONOCHROMATIC_IMAGE -> soloIconoCentrado()
            ComplicationType.SHORT_TEXT -> shortTextMiTurno()
            else -> null
        }

    private fun abrirApp(): PendingIntent = PendingIntent.getActivity(
        this,
        0,
        Intent(this, WearMainActivity::class.java),
        PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
    )

    private fun smallImage(): ComplicationData {
        val imagen = SmallImage.Builder(
            Icon.createWithBitmap(logoSolo()),
            SmallImageType.PHOTO,
        )
            // Imagen segura para modo ambiente/burn-in (trazos finos blancos):
            // sin ella, la doc oficial avisa de que la esfera puede no mostrar
            // ninguna imagen con burn-in protection o low-bit ambient activos.
            .setAmbientImage(Icon.createWithBitmap(logoAmbiente()))
            .build()
        return SmallImageComplicationData.Builder(
            imagen,
            PlainComplicationText.Builder("Logo de Mi Turno").build(),
        )
            .setTapAction(abrirApp())
            .build()
    }

    /**
     * Tipo "solo icono" (MONOCHROMATIC_IMAGE): si el hueco de la esfera lo
     * acepta, pinta el icono del logo centrado, sin reservar línea de texto.
     */
    private fun soloIconoCentrado(): ComplicationData =
        MonochromaticImageComplicationData.Builder(
            MonochromaticImage.Builder(
                Icon.createWithResource(this, R.drawable.complication_icon)
            ).build(),
            PlainComplicationText.Builder("Logo de Mi Turno").build(),
        )
            .setTapAction(abrirApp())
            .build()

    /**
     * Respaldo para huecos solo-texto: nombre "Mi Turno" e icono monocromo
     * del logo. Sin título ni estado.
     */
    private fun shortTextMiTurno(): ComplicationData =
        ShortTextComplicationData.Builder(
            PlainComplicationText.Builder("Mi Turno").build(),
            PlainComplicationText.Builder("Logo de Mi Turno").build(),
        )
            .setMonochromaticImage(
                MonochromaticImage.Builder(
                    Icon.createWithResource(this, R.drawable.complication_icon)
                ).build()
            )
            .setTapAction(abrirApp())
            .build()

    /** Fondo negro + logo neón centrado, sin anillo ni texto. */
    private fun logoSolo(): Bitmap {
        // 384px: la esfera propia lo pinta a ~190px de pantalla; a 128px se
        // veía pixelado al estirarlo.
        val size = 384
        val bmp = Bitmap.createBitmap(size, size, Bitmap.Config.ARGB_8888)
        val canvas = Canvas(bmp)
        val centro = size / 2f

        // Círculo negro sobre lienzo transparente: las esquinas quedan
        // transparentes para no tapar las rayitas de batería que la esfera
        // propia pinta alrededor del hueco del logo.
        val fondo = Paint(Paint.ANTI_ALIAS_FLAG).apply {
            color = Color.BLACK
            style = Paint.Style.FILL
        }
        canvas.drawCircle(centro, centro, centro, fondo)

        val logo = BitmapFactory.decodeResource(resources, R.drawable.brand_taxi_logo)
        if (logo != null) {
            val interior = size * 0.94f
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

    /** Version ambiente: trazos finos blancos sobre negro (seguro para burn-in). */
    private fun logoAmbiente(): Bitmap {
        val size = 128
        val bmp = Bitmap.createBitmap(size, size, Bitmap.Config.ARGB_8888)
        val canvas = Canvas(bmp)
        val centro = size / 2f

        val anillo = Paint(Paint.ANTI_ALIAS_FLAG).apply {
            color = Color.WHITE
            style = Paint.Style.STROKE
            strokeWidth = size * 0.03f
        }
        canvas.drawCircle(centro, centro, centro - size * 0.04f, anillo)

        val letra = Paint(Paint.ANTI_ALIAS_FLAG).apply {
            color = Color.WHITE
            textAlign = Paint.Align.CENTER
            textSize = size * 0.4f
            typeface = android.graphics.Typeface.DEFAULT_BOLD
            style = Paint.Style.STROKE
            strokeWidth = size * 0.02f
        }
        canvas.drawText("T", centro, centro + size * 0.14f, letra)
        return bmp
    }
}
