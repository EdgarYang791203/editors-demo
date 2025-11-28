import { defineConfig, loadEnv } from "vite";
import { svelte } from '@sveltejs/vite-plugin-svelte'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  return {
    base: mode === "production" ? `/${env.VITE_PUBLIC_PATH || ""}/` : "/",
    plugins: [svelte()],
    define: {
      __APP_ENV__: env.APP_ENV,
    },
  };
});