import { defineConfig, loadEnv } from "vite";
import tsConfigPaths from "vite-tsconfig-paths";
import tailwindcss from "@tailwindcss/vite";
import viteReact from "@vitejs/plugin-react";
import { nitro } from "nitro/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import packageJson from "./package.json";

const DEFAULT_HRIS_API_BASE_URL = "http://localhost:8000/api";

const resolveHrisApiOrigin = (baseUrl: string): string => {
  try {
    return new URL(baseUrl).origin;
  } catch {
    return new URL(DEFAULT_HRIS_API_BASE_URL).origin;
  }
};

const buildSecurityHeaders = (hrisApiOrigin: string) => ({
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
  "Content-Security-Policy": `default-src 'self'; script-src 'self' 'unsafe-inline' blob:; style-src 'self' 'unsafe-inline'; font-src 'self' data:; img-src 'self' data: blob: https:; connect-src 'self' https: ${hrisApiOrigin}; frame-src 'self' blob:; object-src 'self' blob:; worker-src 'self' blob:; frame-ancestors 'none'; base-uri 'self'; form-action 'self'`,
});

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const securityHeaders = buildSecurityHeaders(
    resolveHrisApiOrigin(env.VITE_HRIS_API_BASE_URL || env.HRIS_API_BASE_URL),
  );

  return {
    envDir: process.cwd(),
    server: {
      port: 3000,
      strictPort: true,
    },
    define: {
      __APP_VERSION__: JSON.stringify(packageJson.version),
    },
    plugins: [
      tsConfigPaths(),
      tailwindcss(),
      tanstackStart(),
      nitro({
        routeRules: {
          "/**": {
            headers: securityHeaders,
          },
        },
      }),
      viteReact(),
    ],
  };
});
