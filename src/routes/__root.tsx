/// <reference types="vite/client" />
import type { QueryClient } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import {
  HeadContent,
  Outlet,
  Scripts,
  createRootRouteWithContext,
} from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import type { ReactNode } from "react";
import { DefaultCatchBoundary } from "~/components/DefaultCatchBoundary";
import { NotFound } from "~/components/NotFound";
import { ThemeProvider } from "~/components/theme-provider";
import { Toaster } from "~/components/ui/sonner";
import appCss from "~/styles/app.css?url";

const isDev = import.meta.env.DEV;

export const Route = createRootRouteWithContext<{
  queryClient: QueryClient;
}>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Tito Payroll" },
      {
        name: "description",
        content: "Payroll web app. Data and auth live in tito-hris-api.",
      },
    ],
    links: [{ rel: "stylesheet", href: appCss }],
  }),
  errorComponent: (props) => (
    <RootDocument>
      <DefaultCatchBoundary {...props} />
    </RootDocument>
  ),
  notFoundComponent: () => <NotFound />,
  component: RootComponent,
});

function RootComponent() {
  return (
    <RootDocument>
      <Outlet />
    </RootDocument>
  );
}

function RootDocument({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <HeadContent />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                var STORAGE_KEY = 'ui-theme';
                var DARK_QUERY = '(prefers-color-scheme: dark)';
                var theme;
                try {
                  theme = localStorage.getItem(STORAGE_KEY);
                } catch (e) {}
                var root = document.documentElement;
                root.classList.remove('light', 'dark');
                if (!theme || (theme !== 'light' && theme !== 'dark' && theme !== 'system')) {
                  theme = 'light';
                  try {
                    localStorage.setItem(STORAGE_KEY, 'light');
                  } catch (e) {}
                }
                var resolved = theme === 'system'
                  ? (window.matchMedia(DARK_QUERY).matches ? 'dark' : 'light')
                  : theme;
                root.classList.add(resolved);
              })();
            `,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col antialiased">
        <ThemeProvider defaultTheme="light" storageKey="ui-theme">
          {children}
          <Toaster richColors closeButton position="top-right" />
          {isDev ? <TanStackRouterDevtools position="bottom-right" /> : null}
          {isDev ? <ReactQueryDevtools buttonPosition="bottom-left" /> : null}
          <Scripts />
        </ThemeProvider>
      </body>
    </html>
  );
}
