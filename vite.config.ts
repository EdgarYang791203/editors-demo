import { defineConfig } from "vite";
import { svelte } from '@sveltejs/vite-plugin-svelte'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const isProd = mode === "production";

  return {
    base: isProd ? "/editors-demo/" : "/",
    plugins: [svelte()],
  };
});