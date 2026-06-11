package com.mijornada.app

import androidx.concurrent.futures.CallbackToFutureAdapter
import androidx.wear.protolayout.ActionBuilders
import androidx.wear.protolayout.ColorBuilders.argb
import androidx.wear.protolayout.DimensionBuilders
import androidx.wear.protolayout.LayoutElementBuilders
import androidx.wear.protolayout.ModifiersBuilders
import androidx.wear.protolayout.ResourceBuilders
import androidx.wear.protolayout.TimelineBuilders
import androidx.wear.tiles.RequestBuilders
import androidx.wear.tiles.TileBuilders
import androidx.wear.tiles.TileService
import com.google.common.util.concurrent.ListenableFuture

private const val RESOURCES_VERSION = "2"
private const val ID_LOGO = "logo_taxi"

/**
 * Tile (cuadrícula) de Mi Turno con la identidad de la app: logo del taxi,
 * estado en color (verde activo / azul pausa / gris libre) y dos botones de
 * acción al estilo de la home — "Iniciar Turno"/"Continuar" (verde/azul) y
 * "Turnos" (morado). Los botones abren la app con la acción ya disparada:
 * el comando viaja por el circuito seguro de siempre (outbox, operationId,
 * sesión) — la tile nunca escribe datos por su cuenta.
 */
class TurnoTileService : TileService() {

    override fun onTileRequest(requestParams: RequestBuilders.TileRequest): ListenableFuture<TileBuilders.Tile> =
        CallbackToFutureAdapter.getFuture { completer ->
            val anchoPantallaDp = requestParams.deviceConfiguration?.screenWidthDp ?: 192
            completer.set(
                TileBuilders.Tile.Builder()
                    .setResourcesVersion(RESOURCES_VERSION)
                    .setFreshnessIntervalMillis(5 * 60 * 1000L)
                    .setTileTimeline(
                        TimelineBuilders.Timeline.fromLayoutElement(
                            tileLayout(TurnoStatusStore.read(this), anchoPantallaDp)
                        )
                    )
                    .build()
            )
            "TurnoTile"
        }

    override fun onTileResourcesRequest(requestParams: RequestBuilders.ResourcesRequest): ListenableFuture<ResourceBuilders.Resources> =
        CallbackToFutureAdapter.getFuture { completer ->
            completer.set(
                ResourceBuilders.Resources.Builder()
                    .setVersion(RESOURCES_VERSION)
                    .addIdToImageMapping(
                        ID_LOGO,
                        ResourceBuilders.ImageResource.Builder()
                            .setAndroidResourceByResId(
                                ResourceBuilders.AndroidImageResourceByResId.Builder()
                                    .setResourceId(R.drawable.brand_taxi_logo)
                                    .build()
                            )
                            .build()
                    )
                    .build()
            )
            "TurnoTileResources"
        }

    private fun tileLayout(status: TurnoStatusStore.Status, anchoPantallaDp: Int): LayoutElementBuilders.LayoutElement {
        // Logo de la app, centrado (proporción ~2.4:1 del PNG de marca).
        val logo = LayoutElementBuilders.Image.Builder()
            .setResourceId(ID_LOGO)
            .setWidth(DimensionBuilders.dp(anchoPantallaDp * 0.42f))
            .setHeight(DimensionBuilders.dp(anchoPantallaDp * 0.18f))
            .build()

        val estado = when {
            !status.conocido -> texto("Abre para sincronizar", 12f, COLOR_GRIS)
            status.activo && status.pausado -> texto("⏸ En pausa", 13f, COLOR_AZUL)
            status.activo && status.startTime.isNotBlank() -> texto("🚀 Activo desde ${status.startTime}", 13f, COLOR_VERDE)
            status.activo -> texto("🚀 Turno activo", 13f, COLOR_VERDE)
            else -> texto("Sin turno activo", 12f, COLOR_GRIS)
        }

        // Botón izquierdo según estado, como la home de la app.
        val botonIzquierda = when {
            status.activo && status.pausado -> boton("Continuar", COLOR_AZUL, COLOR_AZUL_BG, "continuar", anchoPantallaDp)
            status.activo -> boton("Continuar", COLOR_VERDE, COLOR_VERDE_BG, "continuar", anchoPantallaDp)
            else -> boton("Iniciar Turno", COLOR_VERDE, COLOR_VERDE_BG, "iniciar_turno", anchoPantallaDp)
        }
        val botonTurnos = boton("Turnos", COLOR_MORADO, COLOR_MORADO_BG, "turnos", anchoPantallaDp)

        val fila = LayoutElementBuilders.Row.Builder()
            .setVerticalAlignment(LayoutElementBuilders.VERTICAL_ALIGN_CENTER)
            .addContent(botonIzquierda)
            .addContent(LayoutElementBuilders.Spacer.Builder().setWidth(DimensionBuilders.dp(8f)).build())
            .addContent(botonTurnos)
            .build()

        val columna = LayoutElementBuilders.Column.Builder()
            .setWidth(DimensionBuilders.expand())
            .setHeight(DimensionBuilders.wrap())
            .setHorizontalAlignment(LayoutElementBuilders.HORIZONTAL_ALIGN_CENTER)
            .addContent(logo)
            .addContent(LayoutElementBuilders.Spacer.Builder().setHeight(DimensionBuilders.dp(6f)).build())
            .addContent(estado)
            .addContent(LayoutElementBuilders.Spacer.Builder().setHeight(DimensionBuilders.dp(10f)).build())
            .addContent(fila)
            .build()

        // Toda la tile abre la app (los botones tienen su propia acción).
        return LayoutElementBuilders.Box.Builder()
            .setWidth(DimensionBuilders.expand())
            .setHeight(DimensionBuilders.expand())
            .setVerticalAlignment(LayoutElementBuilders.VERTICAL_ALIGN_CENTER)
            .setHorizontalAlignment(LayoutElementBuilders.HORIZONTAL_ALIGN_CENTER)
            .setModifiers(
                ModifiersBuilders.Modifiers.Builder()
                    .setClickable(clickAbrir("abrir"))
                    .build()
            )
            .addContent(columna)
            .build()
    }

    private fun boton(
        etiqueta: String,
        colorTexto: Int,
        colorFondo: Int,
        accion: String,
        anchoPantallaDp: Int,
    ): LayoutElementBuilders.LayoutElement {
        val anchoBoton = (anchoPantallaDp * 0.84f - 8f) / 2f
        return LayoutElementBuilders.Box.Builder()
            .setWidth(DimensionBuilders.dp(anchoBoton))
            .setHeight(DimensionBuilders.dp(42f))
            .setVerticalAlignment(LayoutElementBuilders.VERTICAL_ALIGN_CENTER)
            .setHorizontalAlignment(LayoutElementBuilders.HORIZONTAL_ALIGN_CENTER)
            .setModifiers(
                ModifiersBuilders.Modifiers.Builder()
                    .setClickable(clickAbrir(accion))
                    .setBackground(
                        ModifiersBuilders.Background.Builder()
                            .setColor(argb(colorFondo))
                            .setCorner(
                                ModifiersBuilders.Corner.Builder()
                                    .setRadius(DimensionBuilders.dp(18f))
                                    .build()
                            )
                            .build()
                    )
                    .build()
            )
            .addContent(texto(etiqueta, 13f, colorTexto))
            .build()
    }

    private fun clickAbrir(accion: String): ModifiersBuilders.Clickable =
        ModifiersBuilders.Clickable.Builder()
            .setId(accion)
            .setOnClick(
                ActionBuilders.LaunchAction.Builder()
                    .setAndroidActivity(
                        ActionBuilders.AndroidActivity.Builder()
                            .setPackageName(packageName)
                            .setClassName(WearMainActivity::class.java.name)
                            .addKeyToExtraMapping(EXTRA_ACCION_TILE, ActionBuilders.stringExtra(accion))
                            .build()
                    )
                    .build()
            )
            .build()

    private fun texto(contenido: String, sizeSp: Float, colorArgb: Int): LayoutElementBuilders.Text =
        LayoutElementBuilders.Text.Builder()
            .setText(contenido)
            .setMaxLines(1)
            .setFontStyle(
                LayoutElementBuilders.FontStyle.Builder()
                    .setSize(DimensionBuilders.sp(sizeSp))
                    .setColor(argb(colorArgb))
                    .build()
            )
            .build()

    companion object {
        // Paleta de la app (home del reloj / móvil).
        private const val COLOR_VERDE = 0xFF3CFF64.toInt()
        private val COLOR_VERDE_BG = 0x2E3CFF64.toInt()
        private const val COLOR_AZUL = 0xFF3B82F6.toInt()
        private val COLOR_AZUL_BG = 0x2E3B82F6.toInt()
        private const val COLOR_MORADO = 0xFF7C5CFF.toInt()
        private val COLOR_MORADO_BG = 0x2E7C5CFF.toInt()
        private const val COLOR_GRIS = 0xFF9CA3AF.toInt()
    }
}
