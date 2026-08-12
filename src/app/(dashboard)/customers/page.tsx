import { CustomersList } from "./CustomersList";
import { headers } from "next/headers";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function CustomersPage() {
  // Fetch via the API route (which works reliably on Vercel) instead
  // of using Prisma directly in the server component (which has
  // intermittent safeWrap issues).
  const h = await headers();
  const host = h.get("x-forwarded-host") || h.get("host") || "localhost:3000";
  const proto = h.get("x-forwarded-proto") || (host.startsWith("localhost") ? "http" : "https");
  const cookie = h.get("cookie") || "";

  const res = await fetch(`${proto}://${host}/api/customers`, {
    headers: { cookie },
    cache: "no-store",
  });
  const customers = res.ok ? await res.json() : [];

  return <CustomersList customers={customers} />;
}
