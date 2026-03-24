import { createAxiosInstance } from "./http";

export const authenticatedApi = createAxiosInstance({ withAuth: true });
