import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { UserRole } from "./types"

// ULTRA-SIMPLE NextAuth configuration with zero dependencies
export const authOptions: NextAuthOptions = {
  secret: 'vsnR8hJQ0e3dKjEhByBDeuLHQICGQc88-KCTHx7-mTMU',
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        // ONLY ALLOW DEMO USERS - NO DATABASE, NO EXTERNAL CALLS
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        // Simple demo user check
        if (credentials.email === 'parent@demo.com' && credentials.password === 'password') {
          return {
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

        if (credentials.email === 'child@demo.com' && credentials.password === 'password') {
          return {
            id: 'child-demo-1',
            email: 'child@demo.com',
            name: 'Noah (Demo Child)',
            role: 'CHILD' as UserRole,
            familyId: 'demo-family-1',
            family: {
              id: 'demo-family-1',
              name: 'Demo Family'
            }
          }
        }

        return null
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
