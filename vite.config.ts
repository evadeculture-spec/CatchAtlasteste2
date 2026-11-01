import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: { host: true },
  build: {
    target: 'es2021',
    cssCodeSplit: true,
    sourcemap: false,
    rollupOptions: {
      output: {
        // React separado: muda raramente, por isso fica em cache entre deploys.
        manualChunks: { react: ['react', 'react-dom'] },
      },
    },
  },
});
