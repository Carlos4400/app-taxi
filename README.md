# Mi Turno — App para Taxistas

App progresiva (PWA) para gestionar tu Turno laboral como taxista. Registra propinas, datáfonos, agencias, extras, gasolina y nulos, y guarda el historial de Turnos en el dispositivo.

## Funcionalidades

- Registro de entradas por categoría: Propinas, Datáfono, Agencias, Extras, Gasolina y Nulos.
- Resumen diario con totales y desglose.
- Historial de Turnos anteriores con edición posterior.
- Exportación del historial completo a CSV (compatible con Excel).
- Modo offline (PWA con Service Worker).
- Teclado numérico adaptado.
- Tema oscuro y diseño optimizado para móvil.
- Persistencia local en el dispositivo (localStorage), sin servidor.

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

Una vez instalada funciona offline y guarda los datos localmente, igual que el APK.

## Uso

1. **Iniciar Turno** — Pulsa "Iniciar Turno" en la pantalla de inicio.
2. **Añadir entradas** — Usa los botones de cada categoría para registrar importes.
3. **Terminar Turno** — Rellena el resumen (dinero total y km recorridos).
4. **Historial** — Accede a Turnos anteriores, edítalas o expórtalas a CSV.

## Tecnologías

- React 18 + TypeScript
- Vite (build)
- Capacitor (empaquetado Android)
- PWA con Service Worker
- localStorage (persistencia)

## Desarrollo

```bash
# Instalar dependencias
npm install

# Modo desarrollo
npm run dev

# Build de producción
npm run build

# Sincronizar web con Android (tras un build)
npx cap sync android

# Compilar APK debug (requiere JDK 17 instalado)
cd android && ./gradlew assembleDebug
```

## Estructura del proyecto

```
app-taxi/
├── src/
│   └── main.tsx              # Componente React principal
├── public/                   # Assets estáticos (icons, manifest, sw)
├── android/                  # Proyecto Android (Capacitor)
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
