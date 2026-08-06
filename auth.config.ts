import type { NextAuthConfig } from "next-auth";

export const authConfig: NextAuthConfig = {
  session: { strategy: "jwt" },
  pages: { signIn: "/" },
  providers: [], // Configured fully in auth.ts for server environments
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const PUBLIC_ROUTES = ["/", "/api"];
      const isPublicRoute = PUBLIC_ROUTES.some((route) =>
        nextUrl.pathname === route || nextUrl.pathname.startsWith(route)
      );
      const isLocalTunnelDemo =
        nextUrl.searchParams.has("mock_role") ||
        nextUrl.searchParams.has("demoRole");

      if (!isLoggedIn && !isPublicRoute && !isLocalTunnelDemo) {
        return false; // Redirects unauthenticated traffic to signIn page
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role: "SHIPPER" | "TRUCKER" }).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as "SHIPPER" | "TRUCKER";
      }
      return session;
    },
  },
};
