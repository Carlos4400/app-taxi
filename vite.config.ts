import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { readFileSync } from 'node:fs';

const pkg = JSON.parse(readFileSync('./package.json', 'utf-8'));
// La versión que verá la app:
//  - En CI: "1.0.<run_number>" (coincide con el tag de la release).
//  - En local: la versión que pone package.json.
const appVersion = process.env.APP_VERSION || pkg.version;

export default defineConfig({
  plugins: [react()],
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
});
