# Análisis del Plan Profesional por Fases — App "Mi Turno"

Documento de revisión solicitado por Carlos. Es un análisis: **no se ha modificado ningún archivo de la app**.

Fecha del análisis: 2026-05-24.

## Cómo se hizo esta revisión (transparencia)

Cada afirmación del plan se verificó leyendo directamente los archivos del proyecto: `public/sw.js`, `public/manifest.json`, `package.json`, `vite.config.ts`, `android/app/build.gradle`, `android/variables.gradle`, `firestore.rules`, `src/firebase.ts`, `src/firestore-sync.ts`, `src/main.tsx`, `README.md`, `AGENTS.md`, los workflows de `.github/workflows/` y la carpeta `src/__tests__/`.

No fue posible ejecutar la suite de tests (`npm test`). Motivo concreto: la carpeta `node_modules` del proyecto está instalada para Windows y, al intentar correr Vitest en el entorno Linux de trabajo, falta el binario nativo `@rollup/rollup-linux-x64-gnu`. Ejecutarla exigiría reinstalar dependencias, lo que modificaría archivos, y la instrucción fue no modificar nada. Por eso la verificación relativa a los tests es **estática** (leyendo el código de los tests y comparándolo con los archivos que comprueban), no por ejecución. Se indica explícitamente en cada punto donde aplica.

## Veredicto general

El plan es sólido, está bien acotado y, sobre todo, respeta la condición más importante del proyecto: **no toca la contabilidad**. La separación entre "lo que se va a tocar" (versionado, updates, reglas de Firebase, mensajes, documentación, estructura del código) y "lo que queda congelado" (cálculos de turnos, liquidación semanal, porcentajes, descuentos, semanas contables, entregas) es correcta y está sostenida en cada fase.

El enfoque por fases con criterios de aceptación y la Fase 6 de validación de contabilidad es una buena práctica. Las afirmaciones técnicas principales del plan se confirman al revisar el código, con **dos matices** que conviene incorporar antes de empezar (detallados en la Fase 1 y la Fase 2).

Conclusión rápida: plan aprobado en lo esencial.

## Revisión fase por fase

### Fase 1 — Blindar versionado y updates

**El bug de `VERSION`: confirmado.** En `public/sw.js` está la línea `if (manifest.version && manifest.version !== VERSION)`. La variable `VERSION` no se declara en ningún punto de `sw.js`. Como esa comparación vive dentro de un `try { ... } catch (e) {}` con el `catch` vacío, el `ReferenceError` se traga en silencio y la función `checkVersion()` no llega nunca a detectar una versión nueva. Es decir, el aviso de actualización para la versión web (PWA) hoy está muerto: el Service Worker nunca envía el mensaje `NEW_VERSION` que la app sí está escuchando en `src/main.tsx`. La afirmación del plan es correcta.

**Versiones descoordinadas: confirmado.** De hecho hay cuatro fuentes de versión distintas y no coinciden entre sí:

| Sitio | Versión actual | Cómo se fija |
|---|---|---|
| `package.json` | 1.0.51 | manual |
| `public/manifest.json` | 1.0.52 | manual, archivo estático |
| `android/app/build.gradle` | versionName 1.0.19 / versionCode 20 | manual, congelado |
| App en ejecución (`__APP_VERSION__`) | en CI: 1.0.&lt;run_number&gt; · en local: la de `package.json` | `vite.config.ts` |

**El flujo de GitHub Releases que el plan quiere "mantener" ya está bien implementado.** La función `checkUpdate()` en `src/main.tsx` (alrededor de la línea 2338) busca un asset cuyo nombre termine en `.apk` y solo ofrece instalación si existe; si no lo encuentra, muestra "No se encontró APK en el último release". El criterio "solo ofrecer instalación cuando exista asset `.apk`" ya se cumple hoy, así que esta parte de la Fase 1 es conservar lo que hay, no construirlo.

**Sobre el criterio de aceptación "el test de update APK pasa".** El test `src/__tests__/apk-update-flow.test.ts` ya existe. Sus dos primeros casos (que comprueban `main.tsx`) se cumplen con el código actual. El tercero ("derives local Android version values from package.json") espera que `android/app/build.gradle` calcule la versión leyendo `package.json` con `JsonSlurper`; el `build.gradle` actual **no** hace eso (mantiene `versionCode 20` y `versionName "1.0.19"` escritos a mano). Por verificación estática, ese tercer caso falla hoy. Dicho de otra forma: el test ya está escrito esperando el resultado de la Fase 1, y buena parte de la Fase 1 consiste en hacerlo pasar.

**Opinión y matices.** De acuerdo con corregir el bug y unificar versiones. Hay un punto que el plan deja abierto y conviene cerrar antes de empezar: "unificar la versión usada por app, manifest, Service Worker y Android" suena sencillo, pero `manifest.json` y `sw.js` son archivos estáticos de `public/` que el build copia tal cual; hoy no pueden recoger la variable `APP_VERSION`. Unificar de verdad exige decidir un mecanismo concreto (un pequeño plugin de Vite o un script de build que escriba la versión en `manifest.json` y en `sw.js` al compilar). Recomiendo que el plan nombre ese mecanismo, porque es la parte que más diseño necesita.

Riesgo a vigilar en Android: `versionCode` debe ser un entero estrictamente creciente o el sistema rechaza la actualización. El test propone derivarlo del último segmento de la versión (`1.0.52` → `52`). Eso funciona mientras la numeración sea `1.0.x`, pero si algún día se pasa a `1.1.0` el último segmento sería `0` y el `versionCode` retrocedería. Conviene dejarlo documentado o usar un cálculo que no pueda decrecer nunca.

### Fase 2 — Endurecer Firebase sin romper login

**Regla de `admins`: confirmado el problema.** La regla actual es `match /admins/{uid} { allow read: if request.auth != null; }`, lo que permite que cualquier usuario autenticado lea el documento de admin de cualquier otro. Restringirlo a que cada usuario solo lea `admins/{su propio uid}` es correcto y, lo más importante, **no rompe la detección de admin**: la función `isAdmin()` de las reglas usa `exists()`, que en Firestore funciona al margen de la regla `read`; y la app (`src/main.tsx`, alrededor de la línea 2164) hace `getDoc(doc(db, "admins", user.uid))`, es decir, siempre lee su propio uid. La afirmación del plan es correcta.

**Lectura pública de `usernames`: correcto mantenerla.** El login por nombre de usuario necesita resolver `username → email` antes de autenticar, así que la lectura abierta de `usernames/{username}` debe quedarse.

**Escrituras de `usernames`: aquí está el matiz importante.** La regla de **creación** ya exige `request.resource.data.uid == request.auth.uid`, así que la parte del plan "al crear, el `uid` debe coincidir" **ya está hecha**. Donde sí hay un hueco real es en la **actualización**: la regla actual `allow update, delete: if ... resource.data.uid == request.auth.uid` comprueba el `uid` del documento *antiguo*, pero no el del documento *nuevo* (`request.resource.data.uid`). Eso permitiría que el dueño de un username modifique su propio documento y reapunte el `uid` hacia otro usuario. Endurecer la actualización como propone el plan es correcto; conviene precisar en el plan que la creación ya cumple y que el cambio real es solo en `update`.

**Opinión.** De acuerdo con las tres ideas de esta fase. Aviso de riesgo operativo: el archivo `firestore.rules` del repositorio es solo una copia de referencia (su propio comentario indica "Pegar este contenido en Firebase Console"); editar el archivo no surte efecto hasta publicar las reglas en la consola de Firebase. Tras publicar hay que probar de verdad: login con email, login con username y el caso de un usuario admin. Una regla mal publicada puede bloquear el acceso, así que conviene hacerlo con calma y comprobando.

### Fase 3 — Limpiar mensajes DEBUG

**Confirmado.** Hay 6 llamadas `alert("DEBUG: ...")` en `src/main.tsx`, entre las líneas 6609 y 6732, todas dentro del flujo de copiar/compartir la liquidación. (`main.tsx` tiene 15 `alert(` en total; los otros 9 no son mensajes DEBUG y el plan no los toca, lo cual es correcto.) Sustituir esos 6 por mensajes normales o un fallback silencioso, dejando el detalle técnico en `console.error`, es una mejora correcta y de riesgo muy bajo. De acuerdo.

### Fase 4 — Actualizar documentación

**Confirmado.** El `README.md` está desactualizado. Afirma "Persistencia local en el dispositivo (localStorage), sin servidor" y en el apartado "Tecnologías" lista únicamente "localStorage (persistencia)", sin mencionar Firebase. Pero la app sí usa Firebase: existen `src/firebase.ts` (Auth con email + Firestore), `src/firestore-sync.ts`, `src/login-screen.tsx`, el archivo `firestore.rules` y la dependencia `firebase ^11.0.0` en `package.json`. El plan acierta de pleno. Es la fase de menor riesgo, porque no toca código que se ejecute, y sería razonable hacerla cuanto antes.

### Fase 5 — Refactor seguro de `src/main.tsx`

**Confirmado.** El archivo `src/main.tsx` tiene 8.591 líneas. Un archivo de ese tamaño es difícil de mantener y el refactor está justificado. El enfoque del plan —incremental, empezando por zonas de bajo riesgo, con tests de caracterización antes de tocar la contabilidad— es el correcto.

Matiz: ya existe una base de tests apreciable en `src/__tests__/` (9 archivos), incluidos `logic.test.ts` (unos 26 KB), `liquidacion-semana.test.ts` (unos 10 KB) y `formatters.test.ts`. Parte de la red de seguridad que pide la Fase 5 ya está puesta; conviene revisarla y completar huecos, no empezar de cero.

Opinión franca: esta es la fase de **mayor riesgo y menor beneficio visible**. Mover 8.591 líneas de sitio es justo donde más fácil resulta romper la contabilidad sin querer. Recomiendo dejarla la última, hacerla en pasos muy pequeños y tratarla como opcional: si en algún momento hay que priorizar, las Fases 1 a 4 aportan más con bastante menos riesgo.

### Fase 6 — Validación de contabilidad

Es el corazón del plan y está bien planteada: suite completa de tests tras cada fase, escenarios realistas (datáfono, agencia/bono, extra, gasolina, nulo, propina, notas, día libre) y comparación de importes antes/después. Funciona como control transversal, no como una fase final aislada, y eso es lo correcto. Refuerza la regla de oro del proyecto: los mismos turnos de entrada deben producir exactamente las mismas cuentas para el jefe.

## Lo que el plan no cubre o conviene precisar

Tres precisiones antes de empezar. Primera: en la Fase 1, "unificar la versión" necesita definir **cómo** se inyecta esa versión en `manifest.json` y `sw.js`, ya que hoy son archivos estáticos; sin ese mecanismo, la unificación queda a medias. Segunda: en la Fase 1, el `versionCode` de Android debe ser monótono creciente; el esquema "último segmento de la versión" funciona con `1.0.x` pero se rompería con un salto a `1.1.0`. Tercera: en la Fase 2, cambiar `firestore.rules` en el repositorio no aplica nada hasta publicar en la consola de Firebase, y hay que probar el login después.

Una observación fuera del plan: `CAMBIOS_AGENT.md` ocupa ya 473 KB y crece sin límite con cada sesión. No es urgente ni afecta a la app, pero en algún momento convendrá archivar las entradas antiguas en otro archivo para que el registro siga siendo manejable.

## Orden sugerido

El orden del plan es razonable. Como ajuste menor, se podría adelantar la Fase 4 (documentación, riesgo cero) y la Fase 3 (mensajes, riesgo bajo) como primeras victorias rápidas; dejar la Fase 1 (versionado) y la Fase 2 (Firebase) como el trabajo técnico de fondo; y situar la Fase 5 (refactor) al final. La Fase 6 (validación de contabilidad) se ejecuta después de cada una de las anteriores.

## Conclusión

Plan aprobado en lo esencial. Las afirmaciones técnicas comprobables son correctas, con dos precisiones: la creación de usernames ya está endurecida en las reglas (el cambio real está solo en la actualización), y "unificar la versión" requiere que el plan defina el mecanismo de inyección en `manifest.json` y `sw.js`. Nada de lo que propone el plan toca los cálculos de turnos, liquidación, porcentajes, descuentos ni semanas contables, que es la condición que el proyecto exige. Cuando se decida empezar, se puede abordar la fase que se prefiera.
