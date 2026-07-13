'use client'

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

// Tipe minimal dari Application milik @splinetool/runtime.
// Pakai `unknown` sebagai jembatan cast, bukan asumsi struktur penuh,
// biar nggak gampang out-of-sync sama versi package aslinya.
interface SplineApplication {
  load: (sceneUrl: string) => Promise<void>;
  addEventListener: (event: string, callback: (e: any) => void) => void;
  dispose: () => void;
}

const BUTTON_STYLE_BASE: React.CSSProperties = {
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
  transition: 'all 0.2s ease',
};

const BUTTON_STYLE_HOVER: React.CSSProperties = {
  backgroundColor: '#0051cc',
  transform: 'translateY(-2px)',
  boxShadow: '0 6px 12px rgba(0, 0, 0, 0.15)',
};

// Nama objek Spline yang dianggap "tombol login". Sengaja dibikin eksplisit
// dan spesifik (bukan nama generik kayak "Group") biar nggak ke-trigger
// nggak sengaja pas user klik bagian lain dari scene.
const LOGIN_TRIGGER_NAMES = ['Login', 'TombolJoin', 'ButtonLogin'];

interface Box3DProps {
  /** Kalau disediakan, dipanggil saat login di-trigger (misal buat buka modal). */
  onJoinClick?: () => void;
  /** Fallback kalau onJoinClick tidak diberikan. Default: '/login'. */
  fallbackHref?: string;
  sceneUrl?: string;
}

export default function Box3D({
  onJoinClick,
  fallbackHref = '/login',
  sceneUrl = 'https://prod.spline.design/2eXUHv51bsL2yQip/scene.splinecode',
}: Box3DProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const appRef = useRef<SplineApplication | null>(null);
  const router = useRouter();

  const [mounted, setMounted] = useState(false);
  const [sceneStatus, setSceneStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [hoverBtn, setHoverBtn] = useState(false);

  // Satu-satunya jalur trigger login, dipakai baik oleh tombol HTML
  // maupun klik objek 3D di scene — supaya perilakunya konsisten.
  const triggerLogin = useCallback(() => {
    if (onJoinClick) {
      onJoinClick();
    } else {
      router.push(fallbackHref);
    }
  }, [onJoinClick, fallbackHref, router]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    let cancelled = false;

    async function initSpline() {
      try {
        const { Application } = await import('@splinetool/runtime');
        if (!canvasRef.current || appRef.current || cancelled) return;

        const app = new Application(canvasRef.current) as unknown as SplineApplication;
        await app.load(sceneUrl);
        if (cancelled) {
          app.dispose();
          return;
        }
        appRef.current = app;
        setSceneStatus('ready');

        app.addEventListener('mouseDown', (e: any) => {
          const name = e?.target?.name;
          if (name && LOGIN_TRIGGER_NAMES.includes(name)) {
            triggerLogin();
          }
        });
      } catch (err) {
        console.error('Gagal memuat scene Spline:', err);
        if (!cancelled) setSceneStatus('error');
      }
    }

    initSpline();

    return () => {
      cancelled = true;
      if (appRef.current) {
        appRef.current.dispose();
        appRef.current = null;
      }
    };
  }, [mounted, sceneUrl, triggerLogin]);

  // Cegah mismatch hydration — jangan render apa pun yang bergantung
  // ke API browser sebelum komponen ter-mount di client.
  if (!mounted) return null;

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
          display: 'block',
          background: '#0a0a0f', // fallback warna dasar selama scene loading/gagal
        }}
      />

      {sceneStatus === 'loading' && (
        <div
          style={{
            position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'rgba(255,255,255,0.6)', fontSize: '14px', zIndex: 5, pointerEvents: 'none',
          }}
        >
          Memuat tampilan...
        </div>
      )}

      {sceneStatus === 'error' && (
        <div
          style={{
            position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'rgba(255,255,255,0.5)', fontSize: '13px', zIndex: 5, pointerEvents: 'none', textAlign: 'center', padding: '20px',
          }}
        >
          Gagal memuat tampilan 3D. Silakan tetap gunakan tombol login di pojok kanan atas.
        </div>
      )}

      <button
        onClick={triggerLogin}
        style={{ ...BUTTON_STYLE_BASE, ...(hoverBtn ? BUTTON_STYLE_HOVER : {}) }}
        onMouseEnter={() => setHoverBtn(true)}
        onMouseLeave={() => setHoverBtn(false)}
      >
        Login
      </button>
    </>
  );
}