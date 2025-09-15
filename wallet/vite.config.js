import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: "../dist",
    emptyOutDir: false,
    minify: false, // Disable minification for debugging
    rollupOptions: {
      input: "./index.jsx",
      output: {
        entryFileNames: "wallet.bundle.js",
        format: "iife"
      }
    }
  }
});
