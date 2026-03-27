export const env = {
  publicApiUrl: process.env.NEXT_PUBLIC_API_URL ?? "https://api.offlode.com",
  appUrl: process.env.NEXT_PUBLIC_APP_URL ?? "https://offlode.com",
} as const;
