import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate", // met à jour le service worker automatiquement
      injectRegister: "auto",

      // Précise ce que le service worker doit mettre en cache
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff,woff2}"],
        runtimeCaching: [
          {
            // Les appels à l'API ne sont PAS gérés par le service worker :
            // cette logique est déjà prise en charge par Dexie/syncService.js
            urlPattern: ({ url }) => url.pathname.startsWith("/api/"),
            handler: "NetworkOnly",
          },
        ],
        // Évite de mettre en cache des fichiers trop volumineux par erreur
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
      },

      manifest: {
        name: "EduLive - Cahier de Texte Online",
        short_name: "EduLive",
        description:
          "Plateforme de gestion du cahier de texte et de suivi des progressions pédagogiques",
        theme_color: "#0d9488", // teal-600, cohérent avec ton thème actuel
        background_color: "#ffffff",
        display: "standalone",
        start_url: "/",
        icons: [
          {
            src: "/pwa-192x192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "/pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
          },
          {
            src: "/pwa-maskable-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },

      devOptions: {
        enabled: true, // permet de tester le SW en dev (npm run dev), pas seulement en build
      },
    }),
  ],
});
