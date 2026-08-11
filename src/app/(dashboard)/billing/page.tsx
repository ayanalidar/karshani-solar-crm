import { prisma } from "@/lib/db";
import { BillingPOS } from "./BillingPOS";

export const dynamic = "force-dynamic";

export default async function BillingPage() {
  const products = await prisma.product.findMany({ orderBy: { category: "asc" } });
  const customers = await prisma.customer.findMany({ orderBy: { name: "asc" } });
  return <BillingPOS products={products} customers={customers} />;
}
