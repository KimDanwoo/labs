import react from "@vitejs/plugin-react";
import { resolve } from "path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    globals: true,
  },
  resolve: {
    alias: {
      "@app": resolve(__dirname, "./src/app"),
      "@entities": resolve(__dirname, "./src/entities"),
      "@features": resolve(__dirname, "./src/features"),
      "@widgets": resolve(__dirname, "./src/widgets"),
      "@views": resolve(__dirname, "./src/views"),
      "@shared": resolve(__dirname, "./src/shared"),
      "@test": resolve(__dirname, "./src/test"),
    },
  },
});
