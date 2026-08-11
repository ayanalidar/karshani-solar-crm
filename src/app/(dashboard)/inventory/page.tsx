import { prisma } from "@/lib/db";
import { InventoryList } from "./InventoryList";

export const dynamic = "force-dynamic";

export default async function InventoryPage() {
  const products = await prisma.product.findMany({ orderBy: { category: "asc" } });
  return <InventoryList products={products} />;
}
