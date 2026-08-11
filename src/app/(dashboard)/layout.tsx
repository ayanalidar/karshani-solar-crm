import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Shell } from "./shell";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const session = cookieStore.get("session");

  if (!session?.value) {
    redirect("/login");
  }

  return <Shell>{children}</Shell>;
}
