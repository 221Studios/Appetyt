import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import fs from 'node:fs';
import path from 'path';
import {defineConfig} from 'vite';

const recipesSource = path.resolve(__dirname, '..', 'data', 'mobile_catalog.json');
const recipesTarget = path.resolve(__dirname, 'public', 'recipes.json');

function copyRecipeCatalog() {
  fs.mkdirSync(path.dirname(recipesTarget), {recursive: true});
  fs.copyFileSync(recipesSource, recipesTarget);
}

export default defineConfig(() => {
  return {
    plugins: [
      {
        name: 'copy-real-recipe-catalog',
        buildStart: copyRecipeCatalog,
      },
      react(),
      tailwindcss(),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
