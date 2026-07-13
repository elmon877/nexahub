'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'

export default function RegisterPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const validateForm = () => {
    if (!email) return 'Email harus diisi'
    if (!password) return 'Password harus diisi'
    if (password.length < 6) return 'Password minimal 6 karakter'
    if (password !== confirmPassword) return 'Password tidak cocok'
    return null
  }

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    
    const validationError = validateForm()
    if (validationError) {
      setError(validationError)
      return
    }

    setLoading(true)
    try {
      const { error: signUpError } = await supabase.auth.signUp({ 
        email, 
        password 
      })

      if (signUpError) {
        setError(signUpError.message)
      } else {
        setSuccess(true)
        setEmail('')
        setPassword('')
        setConfirmPassword('')
        setTimeout(() => router.push('/login'), 2000)
      }
    } catch (err) {
      setError('Terjadi kesalahan. Silakan coba lagi.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ padding: '50px', maxWidth: '400px', margin: '0 auto' }}>
      <h1>Daftar</h1>
      
      {error && (
        <div style={{ 
          padding: '12px', 
          marginBottom: '16px', 
          background: '#FBEEEE', 
          border: '1px solid #E9C4C4', 
          borderRadius: '4px', 
          color: '#A03A3A',
          fontSize: '0.9rem'
        }}>
          {error}
        </div>
      )}

      {success && (
        <div style={{ 
          padding: '12px', 
          marginBottom: '16px', 
          background: '#EAF3EF', 
          border: '1px solid #B9D8CC', 
          borderRadius: '4px', 
          color: '#1F6F5C',
          fontSize: '0.9rem'
        }}>
          ✓ Akun berhasil dibuat! Redirecting ke login...
        </div>
      )}

      <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.9rem', fontWeight: 500 }}>
            Email
          </label>
          <input 
            type="email" 
            placeholder="nama@email.com" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
            required 
            style={{
              width: '100%',
              padding: '10px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '1rem',
              boxSizing: 'border-box',
              opacity: loading ? 0.6 : 1
            }}
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.9rem', fontWeight: 500 }}>
            Password
          </label>
          <input 
            type="password" 
            placeholder="Minimal 6 karakter" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
            required 
            style={{
              width: '100%',
              padding: '10px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '1rem',
              boxSizing: 'border-box',
              opacity: loading ? 0.6 : 1
            }}
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.9rem', fontWeight: 500 }}>
            Konfirmasi Password
          </label>
          <input 
            type="password" 
            placeholder="Ulangi password" 
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            disabled={loading}
            required 
            style={{
              width: '100%',
              padding: '10px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '1rem',
              boxSizing: 'border-box',
              opacity: loading ? 0.6 : 1
            }}
          />
        </div>

        <button 
          type="submit"
          disabled={loading || success}
          style={{
            padding: '12px',
            background: loading || success ? '#ccc' : '#1F6F5C',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            fontSize: '1rem',
            fontWeight: 600,
            cursor: loading || success ? 'not-allowed' : 'pointer',
            transition: 'background 0.3s'
          }}
        >
          {loading ? 'Membuat akun...' : success ? 'Berhasil!' : 'Daftar'}
        </button>

        <p style={{ fontSize: '0.9rem', textAlign: 'center', marginTop: '8px' }}>
          Sudah punya akun? {' '}
          <a href="/login" style={{ color: '#1F6F5C', textDecoration: 'none', fontWeight: 600 }}>
            Login di sini
          </a>
        </p>
      </form>
    </div>
  )
}