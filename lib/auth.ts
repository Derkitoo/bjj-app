import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.role = (user as { role: string }).role;
        token.eleveId = (user as { eleveId: string | null }).eleveId;
        token.motDePasseTemporaire = (user as { motDePasseTemporaire: boolean }).motDePasseTemporaire;
        token.permissions = (user as { permissions: string }).permissions;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        (session.user as unknown as { role: string }).role = token.role as string;
        (session.user as unknown as { eleveId: string | null }).eleveId = token.eleveId as string | null;
        (session.user as unknown as { id: string }).id = token.sub as string;
        (session.user as unknown as { motDePasseTemporaire: boolean }).motDePasseTemporaire = token.motDePasseTemporaire as boolean;
        (session.user as unknown as { permissions: string }).permissions = (token.permissions as string) ?? "[]";
      }
      return session;
    },
  },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Mot de passe", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
        });

        if (!user) return null;

        const valid = await bcrypt.compare(
          credentials.password as string,
          user.password
        );

        if (!valid) return null;
        if (!user.actif) return null;

        return {
          id: user.id,
          email: user.email,
          role: user.role,
          eleveId: user.eleveId,
          motDePasseTemporaire: user.motDePasseTemporaire,
          permissions: user.permissions,
        };
      },
    }),
  ],
});
