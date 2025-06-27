import NextAuth from "next-auth"
import { UserRole } from "@/lib/types"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      email: string
      name: string
      role: UserRole
      familyId: string
      family: {
        id: string
        name: string
      }
    }
  }

  interface User {
    role: UserRole
    familyId: string
    family: {
      id: string
      name: string
    }
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: UserRole
    familyId: string
    family: {
      id: string
      name: string
    }
  }
} 