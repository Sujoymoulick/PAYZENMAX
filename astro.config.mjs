// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';

// Landing page lives at "/" (src/pages/index.astro).
// The billing app (unchanged React MVP) is served at "/app/" (src/pages/app.astro).
export default defineConfig({
  integrations: [react()],
  devToolbar: { enabled: false },
  server: {
    port: 5173,
    host: true
  }
});
