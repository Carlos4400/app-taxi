# Plan premium de vibracion

Este archivo documenta el plan completo propuesto para una experiencia de vibracion premium en la app.

Contexto de uso: app usada conduciendo, en la calle y mirando de reojo. La vibracion debe ayudar a confirmar acciones sin exigir mirar fijo la pantalla.

Fuente verificable de la implementacion actual: `src/services/haptics.ts`.

Fuente oficial de intensidades disponibles: Capacitor Haptics v6 (`ImpactStyle.Light`, `ImpactStyle.Medium`, `ImpactStyle.Heavy`).

## Intensidades actuales

### Light

- Funcion actual: `hapticTap()`
- Intensidad: ligera
- Uso actual: pulsaciones pequenas como teclas numericas.
- Recomendacion premium para esta app: no usarla como intensidad principal, porque conduciendo y en la calle puede notarse poco.

### Medium

- Funcion actual: `hapticConfirm()`
- Intensidad: media
- Uso recomendado: toque operativo normal que el usuario debe notar sin mirar fijo la pantalla.
- Ejemplos recomendados:
  - numeros del teclado
  - borrar
  - coma decimal
  - abrir campos
  - abrir modales
  - cambiar vistas
  - boton atras cuando cierra una capa visible

### Heavy

- Funcion actual: `hapticAction()`
- Intensidad: fuerte
- Uso recomendado: accion importante, guardado, cierre o accion peligrosa.
- Ejemplos recomendados:
  - guardar entrada
  - guardar reserva
  - guardar nota
  - guardar cambios de turno
  - iniciar turno
  - pausar o reanudar turno
  - terminar turno
  - eliminar entrada
  - eliminar turno
  - cerrar sesion confirmado

## Regla premium propuesta

- Tocar o seleccionar: `Medium`
- Teclear numeros: `Medium`
- Cerrar una capa visible con atras: `Medium`
- Guardar correctamente: `Heavy`
- Confirmar accion critica: `Heavy`
- Eliminar: `Heavy`
- Terminar turno: `Heavy`
- Navegacion secundaria sin accion de datos: sin vibracion o `Medium` si se quiere una respuesta mas sensible.

## Plan por pantallas

### 1. Home

- Iniciar o continuar turno: `Heavy`
- Turnos: `Medium`
- Contabilidad: `Medium`
- Calendario: `Medium`
- Reserva: `Medium`
- Ajustes: `Medium`
- Admin: `Medium`
- Confirmar cerrar sesion: `Heavy`

### 2. Pantalla de turno activo

- Abrir Propina: `Medium`
- Abrir Datafono: `Medium`
- Abrir Agencia/Bono: `Medium`
- Abrir Extra: `Medium`
- Abrir Gasolina: `Medium`
- Abrir Nulo: `Medium`
- Boton de nota: `Medium`
- Iniciar turno: `Heavy`
- Pausar turno: `Heavy`
- Reanudar turno: `Heavy`
- Terminar turno: `Heavy`

### 3. Anadir propina y datafono

- Teclas numericas: `Medium`
- Borrar: `Medium`
- Coma decimal: `Medium`
- Cambiar entre Propina y Datafono: `Medium`
- Guardar entrada valida: `Heavy`
- Intentar guardar vacio o invalido: feedback de error si se implementa; recomendado `Heavy` corto o feedback de notificacion.

### 4. Anadir agencia, extra, gasolina y nulo

- Teclas numericas: `Medium`
- Borrar: `Medium`
- Coma decimal: `Medium`
- Guardar entrada valida: `Heavy`
- Intentar guardar vacio o invalido: feedback de error si se implementa; recomendado `Heavy` corto o feedback de notificacion.

### 5. Terminar turno

- Seleccionar campo dinero: `Medium`
- Seleccionar campo km: `Medium`
- Teclas dinero/km: `Medium`
- Guardar campo dinero/km: `Heavy`
- Terminar turno definitivo: `Heavy`
- Cancelar: `Medium` o sin vibracion, segun se prefiera.

### 6. Editar turno

- Abrir campo dinero: `Medium`
- Abrir campo km: `Medium`
- Teclas de dinero/km: `Medium`
- Abrir entrada para editar: `Medium`
- Abrir selector de tipo de entrada nueva: `Medium`
- Abrir importe de entrada nueva: `Medium`
- Teclas de entrada nueva: `Medium`
- Guardar cambios: `Heavy`
- Anadir linea nueva dentro del turno: `Heavy`
- Eliminar entrada: `Heavy`
- Eliminar turno: `Heavy`
- Cancelar edicion: `Medium`

### 7. Historial de entradas del turno actual

- Abrir entrada para editar: `Medium`
- Guardar edicion: `Heavy`
- Eliminar entrada: `Heavy`
- Cancelar: `Medium`

### 8. Calendario y reservas

- Abrir reserva: `Medium`
- Guardar reserva: `Heavy`
- Eliminar reserva: `Heavy`
- Abrir nota: `Medium`
- Guardar nota: `Heavy`
- Eliminar nota: `Heavy`
- Cambiar mes: `Medium` si no resulta molesto.
- Cambiar vista calendario/agenda: `Medium`
- Seleccionar dia: `Medium` si se quiere una respuesta mas sensible.
- Abrir turno desde calendario: `Medium`

### 9. Contabilidad, detalle de mes, detalle anual y detalle de semana

- Abrir detalle de mes: `Medium`
- Abrir detalle anual: `Medium`
- Abrir detalle de semana: `Medium`
- Cambiar mes o ano: `Medium` si no resulta molesto.
- Abrir turno desde contabilidad: `Medium`
- Marcar entregado o no entregado: `Heavy`, porque cambia estado contable.
- Abrir liquidacion semanal: `Medium`

### 10. Liquidacion semanal

- Compartir ticket: `Heavy` si la accion se completa.
- Copiar al portapapeles: `Heavy` si la accion se completa.
- Volver a detalle de semana: `Medium` o sin vibracion.

### 11. Ajustes

- Abrir edicion de porcentaje: `Medium`
- Teclas porcentaje: `Medium`
- Guardar porcentaje: `Heavy`
- Buscar actualizacion: `Medium`
- Instalar actualizacion: `Heavy`
- Abrir menu de backup: `Medium`
- Exportar backup: `Heavy` si se genera correctamente.
- Importar/restaurar backup: `Heavy`, con confirmacion clara.

### 12. Login

- Entrar: `Heavy` si empieza el acceso correctamente.
- Registrar cuenta: `Heavy` si empieza el registro correctamente.
- Recuperar contrasena: `Medium` o `Heavy` si se envia correctamente.
- Cambiar entre login/registro/recuperacion: `Medium`
- Error de login: feedback de error si se implementa.

### 13. Admin

- Abrir lista admin: `Medium`
- Seleccionar usuario: `Medium`
- Cambiar pestaña dentro de usuario admin: `Medium`
- Abrir detalle de turno en admin: `Medium`
- Volver desde usuario admin a lista: `Medium`
- Volver desde lista admin a home: `Medium`

### 14. Boton atras nativo Android

- Si cierra reserva: `Medium`
- Si cierra nota: `Medium`
- Si cierra confirmacion: `Medium`
- Si cierra teclado/modal de dinero o km: `Medium`
- Si cierra selector de mes: `Medium`
- Si cierra menu backup: `Medium`
- Si sale de usuario admin a lista: `Medium`
- Si sale de lista admin a home: `Medium`
- Si solo navega atras entre pantallas: `Medium` opcional.
- Si va a cerrar la app: sin vibracion, para no parecer una confirmacion de guardado.

## Ejemplo practico

Si se anade 1 euro de propina:

1. Pulsar `1`: `Medium`
2. Pulsar `Guardar`: `Heavy`

## Fases de implementacion recomendadas

### Fase 1 - Nombres semanticos

Crear nombres que expresen intencion y no intensidad tecnica:

- `hapticKey`
- `hapticOpen`
- `hapticBackClose`
- `hapticSave`
- `hapticDanger`
- `hapticInvalid`

### Fase 2 - Mapa de intensidades

Mapear esos nombres a intensidades:

- `hapticKey`: `Medium`
- `hapticOpen`: `Medium`
- `hapticBackClose`: `Medium`
- `hapticSave`: `Heavy`
- `hapticDanger`: `Heavy`
- `hapticInvalid`: feedback de error si se implementa; si no, `Heavy`

### Fase 3 - Sustituir por pantallas

Aplicar la regla por pantallas, sin tocar Firestore, Firebase, sincronizacion ni calculos contables.

### Fase 4 - Pruebas

Anadir pruebas para asegurar que:

- las acciones de guardado usan feedback fuerte;
- las teclas usan feedback medio;
- el boton atras nativo cierra capas con feedback medio;
- no se llama vibracion en navegador si `Capacitor.isNativePlatform()` es falso.

### Fase 5 - Prueba real en Android

Probar en dispositivo Android real, porque el navegador local no vibra y cada movil puede sentirse distinto.

## Nota importante

La vibracion solo funciona en app nativa Android/iOS mediante Capacitor. En navegador local o web normal no se nota vibracion.
