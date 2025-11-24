import { defineConfig, Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { createServer } from "./server";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  build: {
    outDir: "dist/spa",
  },
  plugins: [react(), expressPlugin()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./client"),
      "@shared": path.resolve(__dirname, "./shared"),
    },
  },
}));

function expressPlugin(): Plugin {
  return {
    name: "express-plugin",
    apply: "serve", // Only apply during development (serve mode)
    async configureServer(server) {
      try {
        const app = await createServer();
        server.middlewares.use(app);
      } catch (error) {
        console.error('❌ Falha ao inicializar servidor:', error);
        // Criar servidor de erro para mostrar mensagem
        const errorApp = require('express')();
        errorApp.use('*', (req: any, res: any) => {
          if (req.path.startsWith('/api/')) {
            res.status(500).json({ error: 'Banco de dados ou API inacessível' });
          } else {
            res.status(500).send('Servidor inacessível');
          }
        });
        server.middlewares.use(errorApp);
      }
    },
  };
}
