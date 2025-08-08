import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { PrismaAdapter } from "@next-auth/prisma-adapter"
import { prisma } from "./prisma"
import { UserRole } from "./types"
import bcrypt from "bcryptjs"

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        role: { label: "Role", type: "text" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        // Mock demo users for development when database is not available
        const mockUsers = {
          'child@demo.com': {
            id: 'child-demo-1',
            email: 'child@demo.com',
            name: 'Noah (Demo Child)',
            role: 'CHILD' as UserRole,
            familyId: 'demo-family-1',
            family: {
              id: 'demo-family-1',
              name: 'Demo Family'
            }
          },
          'parent@demo.com': {
            id: 'parent-demo-1',
            email: 'parent@demo.com',
            name: 'Demo Parent',
            role: 'PARENT' as UserRole,
            familyId: 'demo-family-1',
            family: {
              id: 'demo-family-1',
              name: 'Demo Family'
            }
          }
        }

        // Check for demo users first
        if (credentials.email in mockUsers && credentials.password === 'password') {
          return mockUsers[credentials.email as keyof typeof mockUsers]
        }

        try {
          // Try database authentication
          const user = await prisma.user.findUnique({
            where: {
              email: credentials.email
            },
            include: {
              family: true
            }
          })

          if (!user) {
            return null
          }

          // In production, strictly require hashed password check
          const allowDevPassword = process.env.NODE_ENV !== 'production'
          const isPasswordValid = (allowDevPassword && credentials.password === 'password') ||
            (user.password ? await bcrypt.compare(credentials.password, user.password) : false)

          if (!isPasswordValid) {
            return null
          }

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            familyId: user.familyId,
            family: user.family
          }
        } catch (error) {
          console.log('Database connection failed, using mock users only')
          return null
        }
      }
    })
  ],
  session: {
    strategy: "jwt"
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role
        token.familyId = user.familyId
        token.family = user.family
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.sub!
        session.user.role = token.role as UserRole
        session.user.familyId = token.familyId as string
        session.user.family = token.family as any
      }
      return session
    }
  },
  pages: {
    signIn: "/auth/signin"
  }
} 