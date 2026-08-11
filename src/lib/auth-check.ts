import { cookies } from "next/headers";
import { NextResponse } from "next/server";

// Check session cookie on API routes. Returns null if authed,
// otherwise returns a 401 NextResponse the caller can return as-is.
export async function requireAuth(): Promise<NextResponse | null> {
  const cookieStore = await cookies();
  const session = cookieStore.get("session");
  if (!session?.value) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}
