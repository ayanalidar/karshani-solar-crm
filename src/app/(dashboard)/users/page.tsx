import { prisma } from "@/lib/db";
import { UsersList } from "./UsersList";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function UsersPage() {
  const users = await prisma.user.findMany({ orderBy: { createdAt: "desc" }, take: 100 });
  // Strip PIN before sending to client
  const safeUsers = users.map((u) => ({ id: u.id, name: u.name, role: u.role, createdAt: u.createdAt }));
  return <UsersList users={safeUsers} />;
}
