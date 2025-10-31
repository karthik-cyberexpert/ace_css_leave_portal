import { defineConfig, loadEnv } from "vite";
import dyadComponentTagger from "@dyad-sh/react-vite-component-tagger";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig(({ mode }) => {
  // Load environment variables
  const env = loadEnv(mode, process.cwd(), '');
  
  // Get configuration from environment variables with fallbacks
  const publicIp = env.PUBLIC_IP || env.DOMAIN || env.SERVER_IP || "localhost";
  const backendPort = env.BACKEND_PORT || env.PORT || "3009";
  const frontendPort = env.FRONTEND_PORT || "8085";
  const protocol = env.ACCESS_PROTOCOL || "http";
  
  // Dynamic API URL
  const apiUrl = env.VITE_API_URL || `${protocol}://${publicIp}:${backendPort}`;
  
  // Build allowed hosts list dynamically
  const allowedHosts = [
    "localhost",
    "127.0.0.1",
    "0.0.0.0",
    publicIp,
    // Add common localhost aliases
    "*.local",
    "*.localhost",
  ];
  
  return {
    // Production build configuration
    build: {
      outDir: "dist",
      emptyOutDir: true,
      sourcemap: false, // SECURITY: Never expose source maps in production
      minify: 'terser', // Use terser for better obfuscation
      terserOptions: {
        compress: {
          drop_console: true, // Remove console logs
          drop_debugger: true, // Remove debugger statements
          pure_funcs: ['console.log', 'console.info', 'console.debug'], // Remove specific console methods
        },
        mangle: {
          toplevel: true, // Mangle top-level names
          properties: false, // Don't mangle properties (can break code)
        },
        format: {
          comments: false, // Remove all comments
        },
      },
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom'],
            router: ['react-router-dom'],
          },
          // Generate random chunk names to obscure structure
          entryFileNames: 'assets/[name]-[hash].js',
          chunkFileNames: 'assets/[name]-[hash].js',
          assetFileNames: 'assets/[name]-[hash].[ext]',
        },
      },
      chunkSizeWarningLimit: 1000,
    },

    // Server configuration for production
    server: {
      host: "0.0.0.0", // Bind to all network interfaces
      port: parseInt(frontendPort), // Frontend port from env
      strictPort: true, // Fail if port is already in use
      allowedHosts,
      proxy: {
        // Proxy API requests to backend
        '/api': {
          target: apiUrl,
          changeOrigin: true,
          secure: protocol === 'https',
          ws: true, // Enable websocket proxying
        },
        '/uploads': {
          target: apiUrl,
          changeOrigin: true,
          secure: protocol === 'https',
        },
        '/health': {
          target: apiUrl,
          changeOrigin: true,
          secure: protocol === 'https',
        }
      },
    },

    // Preview server configuration (for production preview)
    preview: {
      host: "0.0.0.0",
      port: parseInt(frontendPort),
      strictPort: true,
    },

    // Development optimizations
    optimizeDeps: {
      include: ['react', 'react-dom', 'react-router-dom'],
    },

    // Environment variables
    define: {
      'process.env.NODE_ENV': JSON.stringify('production'),
      'process.env.VITE_API_URL': JSON.stringify(apiUrl),
      'process.env.PUBLIC_IP': JSON.stringify(publicIp),
      'process.env.BACKEND_PORT': JSON.stringify(backendPort),
    },

    plugins: [
      dyadComponentTagger(), 
      react({
        // Production optimizations for React
        jsxRuntime: 'automatic',
      })
    ],

    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },

    // CSS configuration
    css: {
      devSourcemap: false, // Disable CSS source maps in production
      modules: {
        localsConvention: 'camelCase',
      },
    },

    // Logging level for production
    logLevel: 'warn',

    // Clear screen on rebuild
    clearScreen: false,
  };
});
