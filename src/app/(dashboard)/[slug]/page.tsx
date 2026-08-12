import { prisma } from "@/lib/db";
import { CrudTable } from "@/components/CrudTable";
import { MODULE_SLUGS } from "@/components/moduleSlugs";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// Maps URL slug → Prisma model name
const MODEL_BY_SLUG: Record<string, string> = {
  enquiries: "enquiry",
  suppliers: "supplierOrder",
  expenses: "expense",
  cashbook: "cashBookEntry",
  installations: "installation",
  amc: "amcContract",
  employees: "employee",
};

export default async function ModulePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const modelName = MODEL_BY_SLUG[slug];

  let rows: Record<string, any>[] = [];
  if (modelName) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      rows = await (prisma as any)[modelName].findMany({
        orderBy: { createdAt: "desc" },
        take: 100,
      });
    } catch {
      rows = [];
    }
  }

  // Convert active from boolean to "true"/"false" for the employees form
  if (slug === "employees") {
    rows = rows.map((r) => ({ ...r, active: r.active ? "true" : "false" }));
  }

  return <CrudTable slug={slug} rows={rows} />;
}

export async function generateStaticParams() {
  return MODULE_SLUGS.map((slug) => ({ slug }));
}
