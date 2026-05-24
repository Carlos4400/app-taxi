# Mi Turno — App para Taxistas

App para gestionar tu Turno laboral como taxista, disponible como APK de Android y como app web progresiva (PWA). Registra propinas, datáfonos, agencias, extras, gasolina y nulos. Cada usuario entra con su cuenta y sus datos se guardan en la nube (Firebase) y se sincronizan entre dispositivos.

## Funcionalidades

- Cuentas de usuario con inicio de sesión por email o nombre de usuario (Firebase Auth).
- Registro de entradas por categoría: Propinas, Datáfono, Agencias, Extras, Gasolina y Nulos.
- Resumen diario con totales y desglose.
- Historial de Turnos anteriores con edición posterior.
- Liquidación semanal con el cálculo de las cuentas a entregar.
- Exportación del historial completo a CSV (compatible con Excel).
- Datos guardados en la nube (Cloud Firestore) y sincronizados entre dispositivos.
- Funcionamiento offline: la app sigue usable sin conexión y sincroniza al recuperarla.
- Teclado numérico adaptado.
- Tema oscuro y diseño optimizado para móvil.

## Instalación

### Android (APK)

Descarga el APK desde la sección Releases del repositorio:

```
https://github.com/Carlos4400/app-taxi/releases/latest
```

Instálalo en tu dispositivo (puede que tengas que activar "Orígenes desconocidos" en Ajustes).

### iPhone / Web (PWA)

La app también se puede instalar como aplicación web en cualquier móvil u ordenador desde:

```
https://Carlos4400.github.io/app-taxi/
```

**iPhone (Safari):** abre la URL → botón Compartir → "Añadir a pantalla de inicio".
**Android (Chrome):** abre la URL → menú ⋮ → "Instalar aplicación".

Una vez instalada, inicia sesión con tu cuenta. Los datos se guardan en tu cuenta (Firebase) y la app sigue funcionando sin conexión, igual que el APK.

## Uso

1. **Iniciar sesión** — Entra con tu email o nombre de usuario, o crea una cuenta nueva.
2. **Iniciar Turno** — Pulsa "Iniciar Turno" en la pantalla de inicio.
3. **Añadir entradas** — Usa los botones de cada categoría para registrar importes.
4. **Terminar Turno** — Rellena el resumen (dinero total y km recorridos).
5. **Historial** — Accede a Turnos anteriores, edítalas o expórtalas a CSV.

## Datos y sincronización

Cada usuario inicia sesión con su cuenta (Firebase Auth) y sus datos —turnos, ajustes, reservas, notas y semanas— se guardan en Cloud Firestore, organizados bajo `users/{uid}`. Esto permite usar la misma cuenta desde varios dispositivos con los datos sincronizados.

Firestore mantiene una caché local persistente en el dispositivo, así que la app sigue siendo usable sin conexión: los cambios hechos offline se sincronizan automáticamente al recuperar la conexión. El Service Worker, además, cachea la propia app para que abra sin red.

`localStorage` ya no es el sistema de almacenamiento principal. Se conserva únicamente como caché y como vía de migración: si un dispositivo tiene datos guardados localmente de una versión anterior a Firebase, esos datos se suben una sola vez a la cuenta del usuario.

## Tecnologías

- React 18 + TypeScript
- Vite (build)
- Capacitor (empaquetado Android)
- Firebase Auth (cuentas de usuario)
- Cloud Firestore (base de datos en la nube, con caché local persistente)
- PWA con Service Worker

## Desarrollo

```bash
# Instalar dependencias
npm install

# Modo desarrollo
npm run dev

# Build de producción
npm run build

# Ejecutar los tests
npm test

# Sincronizar web con Android (tras un build)
npx cap sync android

# Compilar APK debug (requiere JDK 17 instalado)
cd android && ./gradlew assembleDebug
```

## Estructura del proyecto

```
app-taxi/
├── src/
│   ├── main.tsx              # Componente React principal
│   ├── login-screen.tsx      # Pantalla de login, registro y recuperación
│   ├── admin-screens.tsx     # Vistas del modo administrador
│   ├── firebase.ts           # Inicialización de Firebase (Auth + Firestore)
│   ├── firestore-sync.ts     # Sincronización del estado con Firestore
│   ├── formatters.ts         # Utilidades de formato
│   └── __tests__/            # Tests (Vitest)
├── public/                   # Assets estáticos (icons, manifest, sw)
├── android/                  # Proyecto Android (Capacitor)
├── firestore.rules           # Reglas de seguridad de Firestore
├── package.json
├── vite.config.ts
├── capacitor.config.ts
└── .github/workflows/        # CI/CD
    ├── android.yml           # Construye el APK y publica Release
    └── pages.yml             # Despliega la PWA en GitHub Pages
```

## CI/CD

Cada push a `main` dispara dos workflows en paralelo:

1. **`android.yml`** — compila el APK y lo publica como Release del repositorio (etiqueta `v1.0.<run_number>`).
2. **`pages.yml`** — publica la web en `https://Carlos4400.github.io/app-taxi/`.

### Activar GitHub Pages (solo la primera vez)

1. Ve a **Settings** del repositorio en GitHub.
2. **Pages** → **Build and deployment** → en "Source" selecciona **GitHub Actions**.
3. Guarda. A partir del próximo push a `main` la PWA estará viva.

## Licencia

MIT
