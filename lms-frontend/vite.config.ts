import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8084,
    proxy: {
      '/api': {
        target: 'http://localhost:5001',
        changeOrigin: true,
        secure: false,
      },
      '/socket.io': {
        target: 'http://localhost:5001',
        changeOrigin: true,
        ws: true,
      },
    },
  },
  plugins: [
    react(),
    mode === 'production' && {
      name: 'strip-console-logs',
      transform(code: string, id: string) {
        if (id.includes('node_modules')) return null;

        // Remove console.log, console.warn, console.error, console.debug, console.info
        const consoleMethods = ['log', 'warn', 'error', 'debug', 'info'];
        let transformedCode = code;

        consoleMethods.forEach(method => {
          const regex = new RegExp(`console\\.${method}\\([^)]*\\);?`, 'g');
          transformedCode = transformedCode.replace(regex, '');
        });

        // Remove debugger statements
        transformedCode = transformedCode.replace(/debugger\s*;?/g, '');

        return {
          code: transformedCode,
          map: null,
        };
      },
    },
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  esbuild: {
    // Ensure TypeScript files are handled correctly
    include: /\.(ts|tsx|js|jsx)$/,
    exclude: /node_modules/,
  },
  build: {
    // Optimize bundle size
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          ui: ['@radix-ui/react-accordion', '@radix-ui/react-alert-dialog'],
          query: ['@tanstack/react-query'],
          router: ['react-router-dom'],
        },
      },
    },
    // Remove console logs in production
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: mode === 'production',
        drop_debugger: true,
      },
    },
  },
}));
