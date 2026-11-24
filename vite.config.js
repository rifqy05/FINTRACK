import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: process.env.VITE_BASE_PATH || "/FINTRACK/",
  build: {
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            { name: "charts", test: /node_modules[\\/](recharts|d3-|victory-vendor)/ },
            { name: "supabase", test: /node_modules[\\/]@supabase/ },
            { name: "icons", test: /node_modules[\\/]lucide-react/ },
          ],
        },
      },
    },
  },
  test: { include: ["tests/**/*.test.js"], environment: "node" },
});
