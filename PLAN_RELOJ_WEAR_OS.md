# Plan Wear OS - Reloj como mando del movil

## Objetivo

Crear una app para Wear OS que funcione como mando seguro del movil para la parte de trabajo:

- Iniciar turno.
- Anadir entradas al turno activo.
- Anadir notas del turno.
- Terminar turno.
- Consultar el estado confirmado por el movil.

El reloj no sera una app independiente de datos. El movil seguira siendo el cerebro de la app.

## Regla principal

El reloj no escribe en Firestore.

El reloj no escribe en sincronizacion.

El reloj no guarda acciones pendientes.

El reloj solo manda ordenes al movil cuando hay conexion confirmada.

Si no hay conexion confirmada con el movil, el reloj bloquea todas las acciones de trabajo.

## Modo conectado

Cuando el reloj recibe estado confirmado del movil:

```txt
Reloj conectado al movil
  -> puede iniciar turno si no hay turno activo
  -> puede anadir entradas si hay turno activo
  -> puede anadir notas si hay turno activo
  -> puede terminar turno si hay turno activo
```

El reloj solo muestra el estado que confirma el movil.

## Modo no conectado

Cuando el reloj no puede comunicarse con el movil:

```txt
Reloj NO conectado al movil
  -> no iniciar turno
  -> no anadir entradas
  -> no anadir notas
  -> no terminar turno
  -> no guardar nada pendiente
  -> mostrar "Movil no conectado"
```

Pantalla propuesta:

```txt
Movil no conectado

[ Reintentar ]
```

## Comandos reloj -> movil

### GET_STATUS

Pide al movil el estado actual.

```json
{
  "operationId": "watch-uuid",
  "type": "GET_STATUS",
  "createdAt": "2026-06-01T02:08:00"
}
```

### START_TURNO

Inicia turno solo si el movil confirma que no hay turno activo.

```json
{
  "operationId": "watch-uuid",
  "type": "START_TURNO",
  "createdAt": "2026-06-01T02:08:00"
}
```

### ADD_ENTRY

Anade una entrada al turno activo.

Tipos permitidos:

```txt
propina
datafono
agencia_bono
extra
gasolina
nulo
```

```json
{
  "operationId": "watch-uuid",
  "type": "ADD_ENTRY",
  "createdAt": "2026-06-01T02:08:00",
  "payload": {
    "entryType": "propina",
    "amount": 1,
    "note": ""
  }
}
```

### ADD_NOTE

Anade una nota general al turno activo.

```json
{
  "operationId": "watch-uuid",
  "type": "ADD_NOTE",
  "createdAt": "2026-06-01T02:08:00",
  "payload": {
    "note": "Cliente espera en puerta"
  }
}
```

### END_TURNO

Termina el turno activo.

Debe incluir:

- Total taximetro.
- Total kilometros.
- Nota final opcional.

```json
{
  "operationId": "watch-uuid",
  "type": "END_TURNO",
  "createdAt": "2026-06-01T02:08:00",
  "payload": {
    "dinero": 123.45,
    "km": 210,
    "note": ""
  }
}
```

## Respuestas movil -> reloj

### STATUS

```json
{
  "type": "STATUS",
  "connected": true,
  "activeTurno": true,
  "startTime": "10:35",
  "startDate": "2026-06-01"
}
```

### OK

```json
{
  "type": "OK",
  "operationId": "watch-uuid",
  "message": "Guardado"
}
```

### ERROR

```json
{
  "type": "ERROR",
  "operationId": "watch-uuid",
  "code": "NO_ACTIVE_TURNO",
  "message": "No hay turno activo"
}
```

### DUPLICATE_IGNORED

```json
{
  "type": "DUPLICATE_IGNORED",
  "operationId": "watch-uuid",
  "message": "Operacion ya procesada"
}
```

## Regla anti-duplicados

Cada orden del reloj debe llevar un `operationId` unico.

El movil debe guardar los `operationId` ya procesados.

Antes de aplicar una orden:

```txt
Si operationId ya existe:
  -> no aplicar nada
  -> responder DUPLICATE_IGNORED

Si operationId no existe:
  -> validar estado
  -> aplicar accion
  -> guardar operationId como procesado
  -> responder OK
```

Esto evita duplicados si:

- El usuario pulsa dos veces.
- El reloj reintenta.
- La comunicacion envia el mismo mensaje mas de una vez.

## Validaciones del movil

El movil debe rechazar:

- `START_TURNO` si ya hay turno activo.
- `ADD_ENTRY` si no hay turno activo.
- `ADD_ENTRY` con importe menor o igual que cero.
- `ADD_NOTE` si no hay turno activo.
- `ADD_NOTE` sin texto.
- `END_TURNO` si no hay turno activo.
- `END_TURNO` sin taximetro o sin kilometros validos.
- Cualquier comando sin `operationId`.
- Cualquier comando repetido.



## Estructura propuesta

```txt
android/
  app/
    # App movil actual Capacitor.

  wear/
    # App nativa Wear OS.
    # Solo UI del reloj y envio de comandos.
```

No crear `shared-watch/` al inicio salvo que la duplicacion del contrato sea real.

## Fases de implementacion

### Fase 0 - Cerrar base actual

- Confirmar que los cambios actuales estan verificados.
- Commit separado antes de empezar Wear OS.

### Fase 1 - Contrato y tests

- Crear tipos de comandos.
- Crear procesador de comandos del reloj en la app movil.
- Crear registro de `operationId` procesados.
- Tests de duplicados y validaciones.

### Fase 2 - Puente movil

- Crear receptor Android para comandos Wear OS.
- Exponer comandos a la app Capacitor.
- No aplicar comandos si la app no esta preparada.

### Fase 3 - App Wear OS

- Crear modulo `android/wear`.
- UI minima del reloj.
- Estado conectado/no conectado.
- Envio de comandos solo con conexion confirmada.

### Fase 4 - Pruebas reales

- Probar en Xiaomi Watch 5.
- Probar doble pulsacion.
- Probar sin conexion.
- Probar iniciar turno.
- Probar entradas.
- Probar notas.
- Probar terminar turno.

## Fuera de alcance inicial

- No escribir en Firestore desde el reloj.
- No crear cola offline en el reloj.
- No permitir acciones si no hay conexion con el movil.
- No replicar la logica completa de turnos en Kotlin.
- No tocar contabilidad ni sincronizacion como parte de esta fase.
