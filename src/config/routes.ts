export const routes = {
  home: "/",
  login: "/login",
  architectureDiagram: "/synapse-architecture-diagram.html",
} as const;

export type AppRoute = (typeof routes)[keyof typeof routes];
