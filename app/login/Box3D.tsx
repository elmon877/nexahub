'use client'

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

export default function Box3D({ onJoinClick }: { onJoinClick: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const router = useRouter();

  useEffect(() => {
    let app: any;

    const initSpline = async () => {
      try {
        const { Application } = await import('@splinetool/runtime');
        if (canvasRef.current) {
          app = new Application(canvasRef.current);
          await app.load('https://prod.spline.design/2eXUHv51bsL2yQip/scene.splinecode');

          app.addEventListener('mouseDown', (e: any) => {
            // DEBUG: Ini bakal ngeprint nama objek yang lu klik di Console
            console.log("Kamu mengklik objek bernama:", e.target.name);

            // GANTI 'Login' di bawah ini dengan nama yang muncul di console
            // Gue masukin beberapa opsi umum: 'Login', 'TombolJoin', 'Button'
            if (['Login', 'TombolJoin', 'Button', 'Group'].includes(e.target.name)) {
              onJoinClick();
            }
          });
        }
      } catch (err) {
        console.error("Error load Spline:", err);
      }
    };

    initSpline();
    return () => { if (app) app.dispose(); };
  }, [onJoinClick]);

  const handleLoginClick = () => {
    router.push('/dashboard');
  };

  return (
    <>
      <canvas 
        ref={canvasRef} 
        style={{ 
          position: 'fixed', 
          top: 0, 
          left: 0, 
          width: '100vw', 
          height: '100vh', 
          zIndex: -1, 
          display: 'block' 
        }} 
      />
      <button
        onClick={handleLoginClick}
        style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          padding: '12px 24px',
          fontSize: '16px',
          fontWeight: 'bold',
          backgroundColor: '#0070f3',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
          zIndex: 10,
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          transition: 'all 0.3s ease'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = '#0051cc';
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = '0 6px 12px rgba(0, 0, 0, 0.15)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = '#0070f3';
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
        }}
      >
        Login
      </button>
    </>
  );
}