package com.mijornada.app

import androidx.compose.ui.graphics.toArgb
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
import com.mijornada.app.theme.ColorPropina

private const val RESOURCES_VERSION = "4"
private const val ID_LOGO = "logo_taxi"
private const val ID_ICONO_COHETE_VERDE = "icono_cohete_verde"
private const val ID_ICONO_PAUSA_AZUL = "icono_pausa_azul"
private const val ID_ICONO_CLIPBOARD = "icono_clipboard"

/**
 * Tile (cuadrícula) de Mi Turno calcada a la home de la app móvil: logo del
 * taxi, estado en color (verde activo / azul pausa / gris libre) y los botones
 * como en el móvil — apilados a lo ancho, con borde de 2dp en su color, fondo
 * translúcido e icono + texto en negrita ("Iniciar Turno"/"Continuar Turno"
 * verde, azul si el turno está en pausa, y "Turnos" morado). Los botones abren
 * la app con la acción ya disparada: el comando viaja por el circuito seguro
 * de siempre (outbox, operationId, sesión) — la tile nunca escribe datos por
 * su cuenta. Las medidas son fracciones del ancho de pantalla para que el
 * conjunto quepa dentro del círculo en cualquier reloj.
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
                    .addIdToImageMapping(ID_LOGO, imagen(R.drawable.brand_taxi_logo))
                    // Iconos pre-tintados (las tiles no tintan en runtime),
                    // espejo de los iconos de la home del móvil.
                    .addIdToImageMapping(ID_ICONO_COHETE_VERDE, imagen(R.drawable.tile_cohete_verde))
                    .addIdToImageMapping(ID_ICONO_PAUSA_AZUL, imagen(R.drawable.tile_pausa_azul))
                    .addIdToImageMapping(ID_ICONO_CLIPBOARD, imagen(R.drawable.tile_clipboard_morado))
                    .build()
            )
            "TurnoTileResources"
        }

    private fun imagen(resId: Int): ResourceBuilders.ImageResource =
        ResourceBuilders.ImageResource.Builder()
            .setAndroidResourceByResId(
                ResourceBuilders.AndroidImageResourceByResId.Builder()
                    .setResourceId(resId)
                    .build()
            )
            .build()

    private fun tileLayout(status: TurnoStatusStore.Status, anchoPantallaDp: Int): LayoutElementBuilders.LayoutElement {
        // Logo de la app, centrado (proporción ~2.4:1 del PNG de marca).
        val logo = LayoutElementBuilders.Image.Builder()
            .setResourceId(ID_LOGO)
            .setWidth(DimensionBuilders.dp(anchoPantallaDp * 0.42f))
            .setHeight(DimensionBuilders.dp(anchoPantallaDp * 0.18f))
            .build()

        // Sin línea de estado (decisión del usuario: redundante). El estado lo
        // comunica el botón principal: verde "Iniciar/Continuar Turno" o azul
        // "Turno Pausado" con icono de pausa (tocarlo abre la app igualmente).
        val botonPrincipal = when {
            status.activo && status.pausado -> boton("Turno Pausado", COLOR_AZUL, COLOR_AZUL_BG, ID_ICONO_PAUSA_AZUL, "continuar", anchoPantallaDp)
            status.activo -> boton("Continuar Turno", COLOR_VERDE, COLOR_VERDE_BG, ID_ICONO_COHETE_VERDE, "continuar", anchoPantallaDp)
            else -> boton("Iniciar Turno", COLOR_VERDE, COLOR_VERDE_BG, ID_ICONO_COHETE_VERDE, "iniciar_turno", anchoPantallaDp)
        }
        val botonTurnos = boton("Turnos", COLOR_MORADO, COLOR_MORADO_BG, ID_ICONO_CLIPBOARD, "turnos", anchoPantallaDp)

        val columna = LayoutElementBuilders.Column.Builder()
            .setWidth(DimensionBuilders.expand())
            .setHeight(DimensionBuilders.wrap())
            .setHorizontalAlignment(LayoutElementBuilders.HORIZONTAL_ALIGN_CENTER)
            .addContent(logo)
            .addContent(LayoutElementBuilders.Spacer.Builder().setHeight(DimensionBuilders.dp(anchoPantallaDp * 0.04f)).build())
            // Apilados a lo ancho como en el móvil; el ancho 0.64 cabe dentro
            // de la cuerda del círculo a la altura del botón inferior.
            .addContent(botonPrincipal)
            .addContent(LayoutElementBuilders.Spacer.Builder().setHeight(DimensionBuilders.dp(anchoPantallaDp * 0.03f)).build())
            .addContent(botonTurnos)
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
        iconoId: String,
        accion: String,
        anchoPantallaDp: Int,
    ): LayoutElementBuilders.LayoutElement {
        // Estilo de la home del móvil: borde 2dp del color, fondo translúcido
        // e icono + texto. Ancho 0.64 del diámetro (cabe en el arco inferior).
        val ladoIcono = DimensionBuilders.dp(anchoPantallaDp * 0.085f)
        val contenido = LayoutElementBuilders.Row.Builder()
            .setVerticalAlignment(LayoutElementBuilders.VERTICAL_ALIGN_CENTER)
            .addContent(
                LayoutElementBuilders.Image.Builder()
                    .setResourceId(iconoId)
                    .setWidth(ladoIcono)
                    .setHeight(ladoIcono)
                    .build()
            )
            .addContent(LayoutElementBuilders.Spacer.Builder().setWidth(DimensionBuilders.dp(6f)).build())
            .addContent(texto(etiqueta, 13f, colorTexto))
            .build()
        return LayoutElementBuilders.Box.Builder()
            .setWidth(DimensionBuilders.dp(anchoPantallaDp * 0.64f))
            .setHeight(DimensionBuilders.dp(anchoPantallaDp * 0.175f))
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
                                    .setRadius(DimensionBuilders.dp(anchoPantallaDp * 0.0875f))
                                    .build()
                            )
                            .build()
                    )
                    .setBorder(
                        ModifiersBuilders.Border.Builder()
                            .setWidth(DimensionBuilders.dp(2f))
                            .setColor(argb(colorTexto))
                            .build()
                    )
                    .build()
            )
            .addContent(contenido)
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
        // Paleta de la app (home del reloj / movil). El verde sale del tema
        // (ColorPropina) para que un cambio de paleta en el tema se propague
        // a la Tile sin tocar este archivo. Los fondos translucidos conservan
        // el alpha 0x2E (~18%) del estilo del boton translucido del tile.
        private val COLOR_VERDE = ColorPropina.toArgb()
        private val COLOR_VERDE_BG = ColorPropina.copy(alpha = 0.18f).toArgb()
        private const val COLOR_AZUL = 0xFF3B82F6.toInt()
        private val COLOR_AZUL_BG = 0x2E3B82F6.toInt()
        private const val COLOR_MORADO = 0xFF7C5CFF.toInt()
        private val COLOR_MORADO_BG = 0x2E7C5CFF.toInt()
    }
}
