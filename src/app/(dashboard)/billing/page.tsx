import { prisma } from "@/lib/db";
import { BillingPOS } from "./BillingPOS";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function BillingPage() {
  const [products, customers] = await Promise.all([
    prisma.product.findMany({ orderBy: { category: "asc" }, take: 100 }),
    prisma.customer.findMany({ orderBy: { name: "asc" }, take: 100 }),
  ]);
  return <BillingPOS products={products} customers={customers} />;
}
