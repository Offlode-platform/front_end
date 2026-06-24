import { redirect } from "next/navigation";
import { HomeRedirect } from "@/features/auth/components/home-redirect";

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

  // A magic-link token rides in the URL, so the server can read it: clients
  // landing here with one go straight to their portal, not the staff app.
  const rawToken = params.magic_link ?? params.token;
  const token = Array.isArray(rawToken) ? rawToken[0] : rawToken;
  if (token) {
    redirect(`/portal?magic_link=${encodeURIComponent(token)}`);
  }

  // The session token lives in localStorage, which the server can't see, so we
  // can't decide dashboard-vs-login here. Hand off to a client gate that reads
  // the real auth state — logged-out visitors go to /login without ever
  // flashing the dashboard.
  return <HomeRedirect />;
}
