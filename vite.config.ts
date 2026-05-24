import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';

const pkg = JSON.parse(readFileSync('./package.json', 'utf-8'));
// La versión que verá la app:
//  - En CI: "1.0.<run_number>" (coincide con el tag de la release).
//  - En local: la versión que pone package.json.
const appVersion = process.env.APP_VERSION || pkg.version;

// Plugin: tras el build, sustituye el marcador __BUILD_VERSION__ por la versión
// real (appVersion) en dist/manifest.json y dist/sw.js. Así la app
// (__APP_VERSION__), el manifest y el Service Worker comparten exactamente la
// misma versión y el aviso de actualización de la PWA funciona de forma fiable.
function inyectarVersion(version: string) {
  return {
    name: 'inyectar-version',
    apply: 'build' as const,
    closeBundle() {
      for (const archivo of ['dist/manifest.json', 'dist/sw.js']) {
        if (existsSync(archivo)) {
          const contenido = readFileSync(archivo, 'utf-8');
          writeFileSync(archivo, contenido.split('__BUILD_VERSION__').join(version));
        }
      }
    },
  };
}

export default defineConfig({
  plugins: [react(), inyectarVersion(appVersion)],
  root: '.',
  base: './',
  define: {
    __APP_VERSION__: JSON.stringify(appVersion),
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    target: 'es2020',
    minify: 'esbuild',
  },
  server: {
    port: 3000,
    open: false,
  },
  test: {
    environment: 'jsdom',
  },
});
