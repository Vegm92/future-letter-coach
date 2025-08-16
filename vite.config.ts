import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@/design-system": path.resolve(__dirname, "./src/design-system"),
      "@/atoms": path.resolve(__dirname, "./src/atoms"),
      "@/molecules": path.resolve(__dirname, "./src/molecules"),
      "@/organisms": path.resolve(__dirname, "./src/organisms"),
      "@/templates": path.resolve(__dirname, "./src/templates"),
      "@/pages": path.resolve(__dirname, "./src/pages"),
      "@/features": path.resolve(__dirname, "./src/features"),
      "@/shared": path.resolve(__dirname, "./src/shared"),
      "@/infrastructure": path.resolve(__dirname, "./src/infrastructure"),
    },
  },
}));
