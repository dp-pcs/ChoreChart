import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { UserRole } from "./types"
import { prisma } from "./prisma"
import bcrypt from "bcryptjs"

// ULTRA-SIMPLE NextAuth configuration with zero dependencies
export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        // Demo users for fallback
        const mockUsers = {
          'parent@demo.com': {
            id: 'parent-demo-1',
            email: 'parent@demo.com',
            name: 'Demo Parent',
            role: 'PARENT' as UserRole,
            familyId: 'demo-family-1',
            family: { id: 'demo-family-1', name: 'Demo Family' }
          },
          'child@demo.com': {
            id: 'child-demo-1',
            email: 'child@demo.com',
            name: 'Noah (Demo Child)',
            role: 'CHILD' as UserRole,
            familyId: 'demo-family-1',
            family: { id: 'demo-family-1', name: 'Demo Family' }
          }
        }

        try {
          // Try database authentication first
          const user = await prisma.user.findUnique({
            where: { email: credentials.email },
            include: {
              family: {
                select: { id: true, name: true }
              }
            }
          })

          if (user) {
            // Check password
            const allowDevPassword = process.env.NODE_ENV !== 'production'
            const isPasswordValid = (allowDevPassword && credentials.password === 'password') ||
              (user.password ? await bcrypt.compare(credentials.password, user.password) : false)

            if (isPasswordValid) {
              return {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                familyId: user.familyId,
                family: user.family
              }
            }
          }

          // Fallback to demo users if database auth fails
          if (credentials.email in mockUsers && credentials.password === 'password') {
            return mockUsers[credentials.email as keyof typeof mockUsers]
          }

          return null

        } catch (error) {
          console.error('Database auth failed, trying demo users:', error)
          
          // Use demo users as fallback
          if (credentials.email in mockUsers && credentials.password === 'password') {
            return mockUsers[credentials.email as keyof typeof mockUsers]
          }
          
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
