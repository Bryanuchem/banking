import path from "node:path";

import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const cloudflareHosts = [".trycloudflare.com"];

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    host: "0.0.0.0",
    port: 5173,
    allowedHosts: cloudflareHosts,
  },
  preview: {
    host: "0.0.0.0",
    port: 5173,
    allowedHosts: cloudflareHosts,
  },
});
