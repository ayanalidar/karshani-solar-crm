import { prisma } from "@/lib/db";
import { CustomersList } from "./CustomersList";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function CustomersPage() {
  const customers = await prisma.customer.findMany({ orderBy: { name: "asc" }, take: 100 });
  return <CustomersList customers={customers} />;
}
