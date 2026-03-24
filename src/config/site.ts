import { APP_NAME } from "@/constants/app";
import { env } from "./env";

export const siteConfig = {
  name: APP_NAME,
  url: env.appUrl || "http://localhost:3000",
} as const;
