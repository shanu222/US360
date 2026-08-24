import type { NextAuthConfig } from "next-auth";

export const authSecret =
  process.env.AUTH_SECRET ||
  process.env.NEXTAUTH_SECRET ||
  (process.env.VERCEL ? "vercel-build-placeholder-set-AUTH_SECRET-in-project-env" : undefined);

export const authConfig = {
  secret: authSecret,
  trustHost: true,
  session: { strategy: "jwt", maxAge: 60 * 60 * 24 * 14 },
  pages: {
    signIn: "/login",
    newUser: "/onboarding",
  },
  providers: [],
} satisfies NextAuthConfig;
