"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import { createDemoSource } from "./demo-source";
import type { SchoolDataSource } from "./source";

const DataSourceContext = createContext<SchoolDataSource | null>(null);

/** Levert de actieve databron. Fase 1 kent alleen de demo; fase 5 voegt Magister toe. */
export function DataSourceProvider({ children }: { children: ReactNode }) {
  const [source] = useState(() => createDemoSource());
  return <DataSourceContext.Provider value={source}>{children}</DataSourceContext.Provider>;
}

export function useDataSource(): SchoolDataSource {
  const source = useContext(DataSourceContext);
  if (!source) throw new Error("useDataSource moet binnen <DataSourceProvider> gebruikt worden");
  return source;
}
