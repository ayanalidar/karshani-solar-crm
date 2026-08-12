import { prisma } from "@/lib/db";
import { InventoryList } from "./InventoryList";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function InventoryPage() {
  const products = await prisma.product.findMany({ orderBy: { category: "asc" }, take: 100 });
  return <InventoryList products={products} />;
}
