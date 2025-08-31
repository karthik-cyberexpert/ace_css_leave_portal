import { defineConfig, loadEnv } from "vite";
import dyadComponentTagger from "@dyad-sh/react-vite-component-tagger";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig(({ mode }) => {
  // Load environment variables
  const env = loadEnv(mode, process.cwd(), '');
  
  // Get configuration from environment variables with fallbacks for development
  const publicIp = env.PUBLIC_IP || env.DOMAIN || env.SERVER_IP || "localhost";
  const frontendPort = env.FRONTEND_PORT || "8085";
  
  // Build allowed hosts list dynamically
  const allowedHosts = [
    "localhost",
    "127.0.0.1",
    "0.0.0.0",
    publicIp,
    // Development specific hosts
    "192.168.46.89",
    "ace.cs.leaveportal.local",
    "*.local", // Allow all .local domains
    "*.localhost",
  ];
  
  return {
    server: {
      host: "0.0.0.0", // Bind to all network interfaces for LAN access
      port: parseInt(frontendPort), // Development port from env
      allowedHosts,
    },
    plugins: [dyadComponentTagger(), react()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});
