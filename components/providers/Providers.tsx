"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MotionConfig } from "framer-motion";
import { useState, type ReactNode } from "react";
import { DataSourceProvider } from "@/lib/data/context";
import { useSettings } from "@/stores/settings";
import { ThemeSync } from "./ThemeSync";

const REDUCED_MOTION = { system: "user", reduced: "always", full: "never" } as const;

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60_000,
            gcTime: 24 * 60 * 60_000,
            retry: 1,
          },
        },
      }),
  );
  const motion = useSettings((s) => s.motion);

  return (
    <QueryClientProvider client={queryClient}>
      <DataSourceProvider>
        <MotionConfig reducedMotion={REDUCED_MOTION[motion]}>
          <ThemeSync />
          {children}
        </MotionConfig>
      </DataSourceProvider>
    </QueryClientProvider>
  );
}
