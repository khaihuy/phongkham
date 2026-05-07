import NextAuth, { NextAuthConfig } from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { z } from "zod"
import { prisma } from "@/db/prisma"
import bcryptjs from "bcryptjs"

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

const credentialsSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
})

export const authConfig = {
  providers: [
    Credentials({
      async authorize(credentials) {
        try {
          const { username, password } = credentialsSchema.parse(credentials)

          // Find user by username
          const user = await prisma.user.findUnique({
            where: { username },
            select: {
              id: true,
              username: true,
              email: true,
              fullName: true,
              role: true,
              passwordHash: true,
              isActive: true,
              avatarUrl: true,
            },
          })

          if (!user || !user.isActive) {
            return null
          }

          // Verify password
          const isValidPassword = await bcryptjs.compare(password, user.passwordHash)
          if (!isValidPassword) {
            return null
          }

          // Update last login
          await prisma.user.update({
            where: { id: user.id },
            data: { lastLoginAt: new Date() },
          })

          return {
            id: user.id,
            username: user.username,
            email: user.email,
            name: user.fullName,
            role: user.role,
            image: user.avatarUrl ?? undefined,
          }
        } catch (error) {
          console.error("Auth error:", error)
          return null
        }
      },
    }),
  ],
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
        session.user.role = token.role as string
        session.user.username = token.username as string
      }
      return session
    },
    authorized({ auth, request }) {
      const isLoggedIn = !!auth?.user
      const pathname = request.nextUrl.pathname

      // Allow public paths
      if (pathname === "/login") {
        return !isLoggedIn ? true : Response.redirect(new URL("/", request.nextUrl))
      }

      // Protect other routes
      return isLoggedIn
    },
  },
  events: {
    signOut() {
      // Cleanup if needed
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
} satisfies NextAuthConfig

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig)
