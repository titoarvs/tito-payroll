import { defineConfig, loadEnv } from "vite";
import tsConfigPaths from "vite-tsconfig-paths";
import tailwindcss from "@tailwindcss/vite";
import viteReact from "@vitejs/plugin-react";
import { nitro } from "nitro/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";

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
  "Content-Security-Policy": `default-src 'self'; script-src 'self' 'unsafe-inline' https://accounts.google.com; style-src 'self' 'unsafe-inline'; font-src 'self' data:; img-src 'self' data: blob: https:; connect-src 'self' https: ${hrisApiOrigin} https://accounts.google.com; frame-src https://accounts.google.com; frame-ancestors 'none'; base-uri 'self'; form-action 'self' ${hrisApiOrigin}`,
});

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const securityHeaders = buildSecurityHeaders(
    resolveHrisApiOrigin(env.VITE_HRIS_API_BASE_URL || env.HRIS_API_BASE_URL),
  );

  return {
    envDir: process.cwd(),
    server: {
      port: 3002,
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
