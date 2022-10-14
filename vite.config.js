import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    lib: {
      entry: path.resolve(__dirname, 'src/index.ts'),
      fileName: format => `parse-ingredient.${format}.js`,
      formats: ['es', 'cjs', 'umd'],
      name: 'ParseIngredient',
    },
    rollupOptions: {
      external: ['numeric-quantity'],
      output: {
        globals: {
          'numeric-quantity': 'numericQuantity',
        },
        exports: 'named',
      },
    },
    minify: false,
    sourcemap: true,
  },
});
