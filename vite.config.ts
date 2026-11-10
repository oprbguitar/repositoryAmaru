import { cloudflare } from "@cloudflare/vite-plugin";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { amaruDevControl } from "./scripts/dev-server-control";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    // Local-only /__amaru/health and /__amaru/shutdown. Must stay before
    // cloudflare() so its middleware answers before the worker does.
    amaruDevControl(),
    cloudflare({ persistState: { path: ".wrangler/state" } }),
  ],
  server: {
    host: "127.0.0.1",
    port: 5174,
    strictPort: true,
  },
});
