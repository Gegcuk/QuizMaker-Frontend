// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
      "@/types": resolve(__dirname, "./src/types"),
      "@/features": resolve(__dirname, "./src/features"),
      "@/components": resolve(__dirname, "./src/components"),
      "@/api": resolve(__dirname, "./src/api"),
      "@/utils": resolve(__dirname, "./src/utils"),
      "@/pages": resolve(__dirname, "./src/pages"),
      "@/routes": resolve(__dirname, "./src/routes"),
      "@/hooks": resolve(__dirname, "./src/hooks"),
      "@/services": resolve(__dirname, "./src/services"),
    },
  },
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:8080",
        changeOrigin: true,
        secure: false,
      },
      "/v3": {
        target: "http://localhost:8080",
        changeOrigin: true,
        secure: false,
      },
      "/swagger-ui": {
        target: "http://localhost:8080",
        changeOrigin: true,
        secure: false,
      },
      "/swagger-resources": {
        target: "http://localhost:8080",
        changeOrigin: true,
        secure: false,
      },
      "/webjars": {
        target: "http://localhost:8080",
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
