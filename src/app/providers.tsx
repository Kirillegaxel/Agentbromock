"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useState, type ReactNode } from "react";
import { getDataLayer } from "@/data";

export function Providers({ children }: { children: ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { retry: false, refetchOnWindowFocus: false, staleTime: 0 },
          mutations: { retry: false },
        },
      }),
  );

  // Изменения из другой вкладки или демо-панели обновляют все экраны.
  useEffect(() => getDataLayer().api.subscribe(() => void client.invalidateQueries()), [client]);

  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
