import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      external: [
        // Lista de pacotes que não devem ser empacotados,
        // pois já estão no importmap do index.html.
        'react',
        'react/jsx-runtime',
        'react-dom/client',
        '@google/genai',
        'recharts',
        '@supabase/supabase-js',
      ],
    },
  },
});