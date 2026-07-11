import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from './context/AuthContext';

// Wajib ditambahin biar SEO dan title tab browser lu muncul
export const metadata: Metadata = {
  title: 'Nexa Hub',
  description: 'Hub digital untuk travel, finance, dan produktivitas.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}