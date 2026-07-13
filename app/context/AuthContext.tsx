"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase' // Sesuaikan path-nya ke file inisialisasi Supabase lu

interface AuthContextType {
  user: any
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  logout: () => void
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    let mounted = true

    // 1. Ambil sesi aktif saat aplikasi pertama kali dimuat
    const getInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (mounted) {
        if (session) {
          setUser(session.user)
        }
        setIsLoading(false)
      }
    }

    getInitialSession()

    // 2. Dengarkan perubahan status auth (Login, Logout, Token Expired) secara real-time
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted) {
        if (session) {
          setUser(session.user)
        } else {
          setUser(null)
          router.replace('/login')
        }
        setIsLoading(false)
      }
    })

    return () => {
      mounted = false
      subscription?.unsubscribe()
    }
  }, [router])

  // Fungsi Login asli menggunakan Supabase
  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        return { success: false, error: error.message }
      }

      if (data?.user) {
        setUser(data.user)
        return { success: true }
      }

      return { success: false, error: 'Gagal mendapatkan data sesi.' }
    } catch (err) {
      return { success: false, error: 'Terjadi kesalahan jaringan.' }
    }
  }

  // Fungsi Logout asli menggunakan Supabase
  const logout = async () => {
    setIsLoading(true)
    await supabase.auth.signOut()
    setUser(null)
    router.replace('/login')
    setIsLoading(false)
  }

 return (
  <AuthContext.Provider value={{ user, login, logout, isLoading }}>
    {children}
  </AuthContext.Provider>
)
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
};