'use client';

import { useState, useEffect } from 'react';

interface NavbarProps {
  darkMode: boolean;
  toggleDarkMode: () => void;
}

export default function Navbar({ darkMode, toggleDarkMode }: NavbarProps) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'py-3 shadow-lg' : 'py-5 shadow-sm'
      } ${
        darkMode ? 'bg-slate-900/95' : 'bg-white/95'
      } backdrop-blur-md`}
    >
      <div className="max-w-6xl mx-auto px-6 flex justify-between items-center">
        {/* Brand */}
        <div className={`text-xl font-bold flex items-center gap-2 transition-colors ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>
          📝 CatatanPribadi
        </div>

        {/* Toggle Button */}
        <button
          onClick={toggleDarkMode}
          className={`px-6 py-2 rounded-full font-semibold text-white transition-all transform hover:scale-105 active:scale-95 shadow-md hover:shadow-blue-500/30 ${
            darkMode ? 'bg-gradient-to-r from-blue-600 to-blue-700' : 'bg-gradient-to-r from-blue-500 to-blue-600'
          }`}
          >
          {darkMode ? '☀️ Light' : '🌙 Dark'}
        </button>
      </div>
    </nav>
  );
}