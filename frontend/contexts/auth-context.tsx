"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { useRouter } from "next/navigation"

export type UserRole = "student" | "interviewer" | "mentor"

interface User {
  id: string
  name: string
  email: string
  role: UserRole
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  login: (email: string, password: string, role: UserRole) => Promise<boolean>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Demo users for each role
const demoUsers: Record<UserRole, User> = {
  student: {
    id: "student-1",
    name: "김민수",
    email: "student@example.com",
    role: "student"
  },
  interviewer: {
    id: "interviewer-1", 
    name: "박지훈",
    email: "interviewer@example.com",
    role: "interviewer"
  },
  mentor: {
    id: "mentor-1",
    name: "이서연",
    email: "mentor@example.com", 
    role: "mentor"
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // Check for existing session
    const storedUser = localStorage.getItem("auth-user")
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser))
      } catch {
        localStorage.removeItem("auth-user")
      }
    }
    setIsLoading(false)
  }, [])

  const login = async (email: string, password: string, role: UserRole): Promise<boolean> => {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // Demo login - in production, validate against backend
    if (password.length >= 4) {
      const user = { ...demoUsers[role], email }
      setUser(user)
      localStorage.setItem("auth-user", JSON.stringify(user))
      
      // Redirect to role-specific dashboard
      router.push(`/${role}`)
      return true
    }
    return false
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem("auth-user")
    router.push("/")
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
