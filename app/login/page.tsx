'use client'

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Spline from '@splinetool/react-spline';

export default function LoginPage() {
  const router = useRouter();
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (email && password) {
        localStorage.setItem('userEmail', email);
        router.push('/dashboard');
      } else {
        setError('Email dan password harus diisi!');
      }
    } catch (err) {
      setError('Login gagal. Coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* 3D Background pake React Spline */}
      <div style={{ 
        position: 'fixed', 
        top: 0, 
        left: 0, 
        width: '100vw', 
        height: '100vh', 
        zIndex: 0 
      }}>
        <Spline scene="https://prod.spline.design/2eXUHv51bsL2yQip/scene.splinecode" />
      </div>

      {/* Tombol Login */}
      <button
        onClick={() => setIsLoginOpen(true)}
        style={{
          position: 'fixed',
          top: '24px',
          right: '24px',
          padding: '12px 28px',
          fontSize: '16px',
          fontWeight: 'bold',
          background: 'linear-gradient(135deg, #00d4aa 0%, #00a8ff 100%)',
          color: 'white',
          border: 'none',
          borderRadius: '12px',
          cursor: 'pointer',
          zIndex: 100,
          boxShadow: '0 4px 16px rgba(0, 212, 170, 0.4)'
        }}
      >
        Login
      </button>

      {/* Modal Login */}
      {isLoginOpen && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            background: 'rgba(0, 0, 0, 0.7)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 200,
            padding: '20px'
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsLoginOpen(false);
          }}
        >
          <div style={{
            backgroundColor: 'rgba(20, 20, 30, 0.95)',
            padding: '40px',
            borderRadius: '24px',
            width: '100%',
            maxWidth: '420px',
            position: 'relative'
          }}>
            <button
              onClick={() => setIsLoginOpen(false)}
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                width: '32px',
                height: '32px',
                background: 'rgba(255, 255, 255, 0.1)',
                border: 'none',
                borderRadius: '50%',
                color: 'white',
                fontSize: '18px',
                cursor: 'pointer'
              }}
            >
              ✕
            </button>

            <h1 style={{ color: 'white', textAlign: 'center', marginBottom: '8px' }}>Login</h1>
            <p style={{ color: 'rgba(255, 255, 255, 0.6)', textAlign: 'center', marginBottom: '32px' }}>Masuk ke akun lo</p>

            <form onSubmit={handleSubmit}>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                style={{
                  width: '100%',
                  padding: '14px',
                  marginBottom: '16px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '12px',
                  color: 'white',
                  fontSize: '16px'
                }}
                required
              />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                style={{
                  width: '100%',
                  padding: '14px',
                  marginBottom: '16px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '12px',
                  color: 'white',
                  fontSize: '16px'
                }}
                required
              />

              {error && (
                <div style={{ color: '#ff9999', marginBottom: '16px', fontSize: '14px' }}>{error}</div>
              )}

              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '16px',
                  background: 'linear-gradient(135deg, #00d4aa 0%, #00a8ff 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  cursor: loading ? 'not-allowed' : 'pointer'
                }}
              >
                {loading ? 'Loading...' : 'Login'}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}