import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { UserRole } from "./types"

// EMERGENCY MODE: Minimal configuration to bypass all potential issues
export const authOptions: NextAuthOptions = {
  secret: 'vsnR8hJQ0e3dKjEhByBDeuLHQICGQc88-KCTHx7-mTMU',
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        role: { label: "Role", type: "text" }
      },
      async authorize(credentials) {
        console.log('🔐 EMERGENCY AUTH: Starting authorization for:', credentials?.email)
        
        if (!credentials?.email || !credentials?.password) {
          console.log('❌ Missing credentials')
          return null
        }

        // EMERGENCY MODE: Only mock users, no database calls
        const mockUsers = {
          'child@demo.com': {
            id: 'child-demo-1',
            email: 'child@demo.com',
            name: 'Noah (Demo Child)',
            role: 'CHILD' as UserRole,
            familyId: 'demo-family-1'
          },
          'parent@demo.com': {
            id: 'parent-demo-1',
            email: 'parent@demo.com',
            name: 'Demo Parent',
            role: 'PARENT' as UserRole,
            familyId: 'demo-family-1'
          }
        }

        console.log('🎭 EMERGENCY: Checking mock users only')
        if (credentials.email in mockUsers && credentials.password === 'password') {
          console.log('✅ EMERGENCY: Mock user authenticated:', credentials.email)
          return mockUsers[credentials.email as keyof typeof mockUsers]
        }

        console.log('❌ EMERGENCY: No matching mock user found')
        return null
      }
    })
  ],
  session: {
    strategy: "jwt"
  },
  callbacks: {
    async jwt({ token, user }) {
      console.log('📝 JWT callback called')
      if (user) {
        token.role = user.role
        token.familyId = user.familyId
        console.log('✅ JWT token updated with user data')
      }
      return token
    },
    async session({ session, token }) {
      console.log('📋 Session callback called')
      if (token) {
        session.user.id = token.sub!
        session.user.role = token.role as UserRole
        session.user.familyId = token.familyId as string
        console.log('✅ Session updated with token data')
      }
      return session
    }
  },
  pages: {
    signIn: "/auth/signin"
  }
} 