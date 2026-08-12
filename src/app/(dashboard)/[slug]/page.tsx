import { CrudTable } from "@/components/CrudTable";
import { MODULE_SLUGS } from "@/components/moduleSlugs";
import { headers } from "next/headers";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// Maps URL slug → API path
const API_PATH_BY_SLUG: Record<string, string> = {
  enquiries: "/api/enquiries",
  suppliers: "/api/suppliers",
  expenses: "/api/expenses",
  cashbook: "/api/cashbook",
  installations: "/api/installations",
  amc: "/api/amc",
  employees: "/api/employees",
};

export default async function ModulePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const apiPath = API_PATH_BY_SLUG[slug];

  let rows: Record<string, any>[] = [];
  if (apiPath) {
    try {
      const h = await headers();
      const host = h.get("x-forwarded-host") || h.get("host") || "localhost:3000";
      const proto = h.get("x-forwarded-proto") || (host.startsWith("localhost") ? "http" : "https");
      const cookie = h.get("cookie") || "";

      const res = await fetch(`${proto}://${host}${apiPath}`, {
        headers: { cookie },
        cache: "no-store",
      });
      if (res.ok) {
        rows = await res.json();
      }
    } catch {
      rows = [];
    }
  }

  // Convert active from boolean to "true"/"false" for the employees form
  if (slug === "employees") {
    rows = rows.map((r) => ({ ...r, active: r.active ? "true" : "false" }));
  }

  // Pass only serializable data (slug + rows). The CrudTable client
  // component looks up its own config (with format functions returning
  // JSX) from MODULE_CONFIGS — functions can't cross the server/client
  // boundary, so the config MUST live on the client side.
  return <CrudTable slug={slug} rows={rows} />;
}

export async function generateStaticParams() {
  return MODULE_SLUGS.map((slug) => ({ slug }));
}
