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
          // DB unreachable
          console.warn("Database connection failed during login");
        }

        // Fallback: PIN 0000 always works (emergency access when DB is down/empty)
        if (credentials.pin === "0000") {
          console.warn("Using admin fallback login");
          return { id: "admin-001", name: "Admin", role: "admin" };
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
