// Edge-safe auth config dùng cho middleware.
// Không import bcryptjs/prisma (chỉ Node.js runtime). Provider rỗng —
// chỉ dùng để decode/verify JWT có sẵn trong cookie.
//
// Middleware gọi auth() từ file này; API route handler `/api/auth/[...nextauth]`
// dùng config đầy đủ ở src/lib/auth.ts (bao gồm Credentials + DB).

import NextAuth, { type NextAuthConfig } from "next-auth"

declare module "next-auth" {
  interface User {
    id: string
    username: string
    role: string
    email: string
    name: string
    image?: string
  }
  interface Session {
    user: User & {
      role: string
      username: string
    }
  }
  interface JWT {
    role: string
    username: string
  }
}

export const authEdgeConfig = {
  providers: [],
  pages: {
    signIn: "/login",
    error: "/login",
  },
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = user.role
        token.username = user.username
      }
      return token
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = (token.id ?? token.sub) as string
        session.user.role = token.role as string
        session.user.username = token.username as string
      }
      return session
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
  trustHost: true,
} satisfies NextAuthConfig

export const { auth } = NextAuth(authEdgeConfig)
