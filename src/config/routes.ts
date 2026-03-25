export const routes = {
  home: "/",
  login: "/login",
  signup: "/signup",
  twoFaBootstrapSetup: "/login/2fa-setup",
  staffHome: "/staff",
  architectureDiagram: "/synapse-architecture-diagram.html",
} as const;

export type AppRoute = (typeof routes)[keyof typeof routes];
