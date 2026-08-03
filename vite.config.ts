import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const siteUrl = env.VITE_PUBLIC_SITE_URL?.trim().replace(/\/$/, "") ?? "";

  return {
    plugins: [
      react(),
      tailwindcss(),
      {
        name: "social-meta-url",
        transformIndexHtml(html) {
          return html.replaceAll("__SITE_URL__", siteUrl);
        },
      },
    ],

    server: {
      host: "0.0.0.0",
      allowedHosts: [".trycloudflare.com"],
    },

    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            supabase: ["@supabase/supabase-js"],
            routing: ["react-router-dom"],
          },
        },
      },
    },
  };
});
