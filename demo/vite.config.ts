import { defineConfig } from "vitest/config";
import { loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ command, mode }) => {
  const isDemo = mode === "demo";
  const apiUrl = process.env.VITE_API_URL ?? loadEnv(mode, process.cwd(), "VITE_").VITE_API_URL;

  if (command === "build" && !isDemo && !apiUrl?.trim()) {
    throw new Error("VITE_API_URL must be set for production builds.");
  }

  return {
  base: isDemo ? "/RtSHackathon/" : "/",
  server: {
    host: "127.0.0.1",
    port: 8080,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
      '/media': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
    },
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: "./src/test/setup.ts",
  },
  };
});
