import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@/lib/db";

export const { handlers: { GET, POST }, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      name: "PIN",
      credentials: { pin: { label: "PIN", type: "password" } },
      async authorize(credentials) {
        if (!credentials?.pin) return null;
        try {
          const user = await prisma.user.findFirst({
            where: { pin: credentials.pin as string },
          });
          if (user) return { id: user.id, name: user.name, role: user.role };
        } catch {
          if (process.env.NODE_ENV !== "production" && credentials.pin === "0000") {
            console.warn("⚠ Using dev fallback auth (no database). Set DATABASE_URL to connect.");
            return { id: "dev", name: "Admin (Dev)", role: "admin" };
          }
        }
        return null;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        (token as Record<string, unknown>).role = (user as { role?: string }).role;
        (token as Record<string, unknown>).name = (user as { name?: string | null }).name || "";
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as unknown as Record<string, unknown>).role = (token as Record<string, unknown>).role;
      }
      return session;
    },
  },
  pages: { signIn: "/login" },
  session: { strategy: "jwt" },
});
