import { redirect } from "next/navigation";
import { routes } from "@/config/routes";

type SearchParams = {
  magic_link?: string | string[];
  token?: string | string[];
};

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;

  // If a magic link token is present, send the user to the client portal
  // instead of the accountant dashboard.
  const rawToken = params.magic_link ?? params.token;
  const token = Array.isArray(rawToken) ? rawToken[0] : rawToken;
  if (token) {
    redirect(`/portal?magic_link=${encodeURIComponent(token)}`);
  }

  redirect(routes.dashboard);
}
