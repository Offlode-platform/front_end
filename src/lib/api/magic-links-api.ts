import { authenticatedApi } from "./authenticated-client";
import { apiPaths } from "./endpoints";
import type {
  MagicLinkCreateRequest,
  MagicLinkResponse,
} from "@/types/magic-links";

async function readData<T>(p: Promise<{ data: T }>): Promise<T> {
  const { data } = await p;
  return data;
}

export const magicLinksApi = {
  generate(body: MagicLinkCreateRequest) {
    return readData<MagicLinkResponse>(
      authenticatedApi.post(`${apiPaths.magicLinks.base}/`, body),
    );
  },
};
