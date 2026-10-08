// vite.config.ts
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { resolve } from "path";
import { createThemeRuntime, startupPalettes } from './src/context/themeRuntime';

// Executes synchronously in the head, before prerendered content can paint.
// The existing header generator hashes this exact body; no script unsafe-inline.
const themeBootstrap = () => ({
  name: 'theme-bootstrap',
  transformIndexHtml: {
    order: 'pre' as const,
    handler(html: string) {
      const data = JSON.stringify(startupPalettes).replace(/</g, '\\u003c');
      const bootstrap = `<script id="theme-bootstrap">(() => { const runtime = (${createThemeRuntime.toString()})(${data}, window, document); runtime.apply(runtime.readPreferences()); })();</script>`;
      const marker = '<meta name="theme-color" content="#113F71" />';
      if (!html.includes(marker)) throw new Error('Theme bootstrap requires the reviewed head insertion point');
      return html.replace(marker, `${marker}\n    ${bootstrap}`);
    },
  },
});

export default defineConfig({
  plugins: [themeBootstrap(), react()],
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
  test: {
    environment: "jsdom",
    environmentOptions: {
      jsdom: {
        url: "http://localhost:3000/",
      },
    },
    globals: false,
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
    css: true,
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "lcov"],
      reportsDirectory: "coverage",
    },
  },
  server: {
    port: 3000,
    proxy: {
      "/api": {
        target: "http://localhost:8080",
        changeOrigin: true,
        secure: false,
      },
      "/oauth2/authorization": {
        target: "http://localhost:8080",
        changeOrigin: true,
        secure: false,
      },
      "/login/oauth2": {
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
