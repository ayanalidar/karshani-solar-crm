import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";

export const { handlers: { GET, POST }, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      name: "PIN",
      credentials: { pin: { label: "PIN", type: "password" } },
      async authorize(credentials) {
        if (!credentials?.pin) return null;
        const user = await prisma.user.findFirst({
          where: { pin: credentials.pin as string },
        });
        if (!user) return null;
        return { id: user.id, name: user.name, role: user.role };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }: { token: Record<string, unknown>; user: { role?: string; name?: string | null } }) {
      if (user) {
        token.role = user.role;
        token.name = user.name || "";
      }
      return token;
    },
    async session({ session, token }: { session: { user?: { role?: string } }; token: Record<string, unknown> }) {
      if (session.user) {
        session.user.role = token.role as string;
      }
      return session;
    },
  },
  pages: { signIn: "/login" },
  session: { strategy: "jwt" },
});
