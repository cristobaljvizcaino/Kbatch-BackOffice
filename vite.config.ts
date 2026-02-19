import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    // kbatch_selector_enviroments: .env files (loadEnv) O variable de sistema (CI/CD, Cloud Run)
    const kbatchEnv = env.kbatch_selector_enviroments || process.env.kbatch_selector_enviroments || '';
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        // Inyecta kbatch_selector_enviroments en el bundle JS (reemplazo literal en build-time)
        '__KBATCH_ENV__': JSON.stringify(kbatchEnv),
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
