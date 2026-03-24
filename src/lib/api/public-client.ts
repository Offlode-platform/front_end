import { createAxiosInstance } from "./http";

export const publicApi = createAxiosInstance({ withAuth: false });
