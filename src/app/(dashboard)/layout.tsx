import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Shell } from "./shell";

export const dynamic = "force-dynamic";
// Disable Router Cache entirely so every navigation fetches fresh data.
// This fixes the "tab switching shows no data until refresh" issue.
export const revalidate = 0;
export const fetchCache = "force-no-store";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const session = cookieStore.get("session");

  if (!session?.value) {
    redirect("/login");
  }

  return <Shell>{children}</Shell>;
}
