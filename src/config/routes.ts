export const routes = {
  home: "/",
  architectureDiagram: "/synapse-architecture-diagram.html",
} as const;

export type AppRoute = (typeof routes)[keyof typeof routes];
