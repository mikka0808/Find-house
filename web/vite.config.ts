import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const base = process.env.BASE_PATH || "/";
  return {
    plugins: [react()],
    base,
    define: {
      __APP_MODE__: JSON.stringify(mode)
    }
  };
});
