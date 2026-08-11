import type { NextRequest } from "next/server";

export default function proxy(request: NextRequest) {
  // Auth is handled by server components and API routes directly.
  // The proxy exists for Next.js 16 compatibility — let everything through.
  return;
}

export const config = {
  matcher: [],
};
