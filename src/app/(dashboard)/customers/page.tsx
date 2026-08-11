import { prisma } from "@/lib/db";
import { CustomersList } from "./CustomersList";

export const dynamic = "force-dynamic";

export default async function CustomersPage() {
  const customers = await prisma.customer.findMany({ orderBy: { name: "asc" } });
  return <CustomersList customers={customers} />;
}
