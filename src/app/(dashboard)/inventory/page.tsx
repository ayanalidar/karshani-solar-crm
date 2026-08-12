import { InventoryList } from "./InventoryList";
import { headers } from "next/headers";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function InventoryPage() {
  const h = await headers();
  const host = h.get("x-forwarded-host") || h.get("host") || "localhost:3000";
  const proto = h.get("x-forwarded-proto") || (host.startsWith("localhost") ? "http" : "https");
  const cookie = h.get("cookie") || "";

  const res = await fetch(`${proto}://${host}/api/products`, {
    headers: { cookie },
    cache: "no-store",
  });
  const products = res.ok ? await res.json() : [];

  return <InventoryList products={products} />;
}
