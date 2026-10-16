import { defineConfig } from 'vite';
import { resolve } from 'node:path';

const entry = resolve(__dirname, 'src/index.js');

export default defineConfig(({ command, mode }) => {
  if (command === 'build') {
    const minBuild = mode === 'min';

    return {
      build: {
        lib: {
          entry,
          name: 'submito',
          formats: ['es', 'iife'],
          fileName: (format) => {
            const base = minBuild ? 'submito.min' : 'submito';
            return format === 'es' ? `${base}.mjs` : `${base}.js`;
          },
        },
        target: 'es2022',
        minify: minBuild,
        sourcemap: false,
        emptyOutDir: !minBuild,
      },
    };
  }

  // `npm run play` — playground only. It imports live source from src/ and mocks
  // POST /api/submit in the browser (playground/mock.js), so no server plugin is needed.
  return {
    root: resolve(__dirname, 'playground'),
    server: {
      open: true,
      fs: {
        allow: [__dirname],
      },
    },
  };
});
