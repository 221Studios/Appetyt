import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import fs from 'node:fs';
import path from 'path';
import {defineConfig} from 'vite';

const recipesSource = path.resolve(__dirname, '..', 'data', 'mobile_catalog.json');
const recipesTarget = path.resolve(__dirname, 'public', 'recipes.json');
const recipesIndexSource = path.resolve(__dirname, '..', 'data', 'mobile_catalog_index.json');
const recipesIndexTarget = path.resolve(__dirname, 'public', 'recipes-index.json');

function copyIfExists(source: string, target: string) {
  if (!fs.existsSync(source)) return;
  fs.mkdirSync(path.dirname(target), {recursive: true});
  fs.copyFileSync(source, target);
}

function copyRecipeCatalog() {
  copyIfExists(recipesSource, recipesTarget);
  copyIfExists(recipesIndexSource, recipesIndexTarget);
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
      // DISABLE_HMR=true turns off hot reload and file watching.
      hmr: process.env.DISABLE_HMR !== 'true',
      // This is useful in constrained or externally managed development environments.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
