import { readFileSync } from 'node:fs';
import { defineConfig, type Plugin } from 'vite';

const legacyAssets = [
  'js/00-state.js', 'js/01-firebase-config.js', 'js/02-auth.js', 'js/03-utils.js',
  'js/04-nav.js', 'js/05-persistencia.js', 'js/06-selects.js', 'js/07-config-page.js',
  'js/08-calculo-mensal.js', 'js/10-dashboard.js', 'js/11-categorias.js',
  'js/12-divida.js', 'js/13-export-excel.js', 'js/14-tema.js', 'js/15-reminder.js',
  'js/16-init.js', 'sw.js', 'manifest.json', 'icons/icon-192.png', 'icons/icon-512.png',
];

function copyLegacyAssets(): Plugin {
  return {
    name: 'copy-legacy-assets',
    generateBundle() {
      for (const fileName of legacyAssets) {
        this.emitFile({ type: 'asset', fileName, source: readFileSync(fileName) });
      }
    },
  };
}

export default defineConfig({
  publicDir: false,
  plugins: [copyLegacyAssets()],
  server: {
    port: 5173,
    strictPort: false,
  },
  build: {
    target: 'es2020',
    sourcemap: true,
  },
});
