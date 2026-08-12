import { BillingPOS } from "./BillingPOS";
import { headers } from "next/headers";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function BillingPage() {
  const h = await headers();
  const host = h.get("x-forwarded-host") || h.get("host") || "localhost:3000";
  const proto = h.get("x-forwarded-proto") || (host.startsWith("localhost") ? "http" : "https");
  const cookie = h.get("cookie") || "";

  const [productsRes, customersRes] = await Promise.all([
    fetch(`${proto}://${host}/api/products`, { headers: { cookie }, cache: "no-store" }),
    fetch(`${proto}://${host}/api/customers`, { headers: { cookie }, cache: "no-store" }),
  ]);
  const products = productsRes.ok ? await productsRes.json() : [];
  const customers = customersRes.ok ? await customersRes.json() : [];

  return <BillingPOS products={products} customers={customers} />;
}
