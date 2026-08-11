import { prisma } from "@/lib/db";
import { QuotationBuilder } from "./QuotationBuilder";

export const dynamic = "force-dynamic";

export default async function NewQuotationPage() {
  const products = await prisma.product.findMany({ orderBy: { name: "asc" } });
  const customers = await prisma.customer.findMany({ orderBy: { name: "asc" } });
  return <QuotationBuilder products={products} customers={customers} />;
}
