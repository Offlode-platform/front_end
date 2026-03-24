import axios from "axios";
import { env } from "@/config/env";

export const apiClient = axios.create({
  baseURL: env.publicApiUrl || undefined,
  headers: {
    "Content-Type": "application/json",
  },
});
