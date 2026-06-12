import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, renderHook } from "@testing-library/react";
import type { RenderOptions } from "@testing-library/react";
import type { ReactNode } from "react";

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });
}

function makeWrapper(client: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
  };
}

export function renderWithQuery(
  ui: React.ReactElement,
  options?: Omit<RenderOptions, "wrapper">
) {
  const client = makeQueryClient();
  return {
    ...render(ui, { wrapper: makeWrapper(client), ...options }),
    client,
  };
}

export function renderHookWithQuery<T>(hook: () => T) {
  const client = makeQueryClient();
  return {
    ...renderHook(hook, { wrapper: makeWrapper(client) }),
    client,
  };
}
