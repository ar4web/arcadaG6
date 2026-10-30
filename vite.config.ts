import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath, URL } from 'node:url';

// https://vite.dev/config/
export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    envPrefix: ['VITE_', 'NEXT_PUBLIC_'],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    define: {
      __APP_VERSION__: JSON.stringify(process.env.npm_package_version ?? '0.1.0'),
    },
    server: {
      host: '0.0.0.0',
      port: 5173,
      strictPort: false,
      // The Arena preview proxies the app under `*.e2b.app`, so the dev server
      // must not reject foreign Host headers.
      allowedHosts: true,
      hmr: { clientPort: 443, protocol: 'wss' },
    },
    preview: {
      host: '0.0.0.0',
      allowedHosts: true,
    },
    build: {
      target: 'es2022',
      chunkSizeWarningLimit: 900,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (!id.includes('node_modules')) return;
            if (id.includes('recharts') || id.includes('d3-')) return 'charts';
            if (id.includes('@supabase')) return 'supabase';
            if (id.includes('xlsx')) return 'xlsx';
            if (id.includes('docx')) return 'docx';
            if (id.includes('html2pdf') || id.includes('jspdf') || id.includes('html2canvas') || id.includes('canvg')) return 'pdf';
            if (id.includes('framer-motion')) return 'motion';
            if (id.includes('@dnd-kit')) return 'dnd';
            if (id.includes('@radix-ui') || id.includes('cmdk')) return 'radix';
            return 'vendor';
          },
        },
      },
    },
  };
});
