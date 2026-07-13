'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'
import { CardSimple, ModalSimple, DetailModal, ConfirmDialog, ToastStack, Toast } from './DashboardComponents'

const NAV_ITEMS = [
  { key: 'semua', label: 'Semua entri', icon: '◧' },
  { key: 'catatan', label: 'Catatan', icon: '✎' },
  { key: 'dokumen', label: 'Dokumen', icon: '▤' },
  { key: 'tautan', label: 'Tautan', icon: '⛓' },
] as const

const SORT_OPTIONS = [
  { key: 'terbaru', label: 'Terbaru' },
  { key: 'terlama', label: 'Terlama' },
  { key: 'judul', label: 'Judul A-Z' },
] as const

export default function DashboardPage() {
  const router = useRouter()

  // auth
  const [authChecked, setAuthChecked] = useState(false)
  const [user, setUser] = useState<{ id: string; name: string } | null>(null)

  const [catatan, setCatatan] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [filterFavorit, setFilterFavorit] = useState(false)
  const [tabAktif, setTabAktif] = useState<'semua' | 'catatan' | 'dokumen' | 'tautan'>('semua')
  const [sortBy, setSortBy] = useState<'terbaru' | 'terlama' | 'judul'>('terbaru')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [initialModalData, setInitialModalData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [detailItem, setDetailItem] = useState<any>(null)
  const [confirmDeleteItem, setConfirmDeleteItem] = useState<any>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [toasts, setToasts] = useState<Toast[]>([])
  const toastId = useRef(0)

  function notify(message: string, type: 'success' | 'error' | 'info' = 'info') {
    const id = ++toastId.current
    setToasts(prev => [...prev, { id, message, type }])
  }
  function dismissToast(id: number) {
    setToasts(prev => prev.filter(t => t.id !== id))
  }

  // ---- AUTH GUARD DISEMPURNAKAN ----
  useEffect(() => {
    let mounted = true

    const periksaSesi = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!mounted) return
      if (!session) {
        router.replace('/login')
        return
      }
      setUser({ id: session.user.id, name: session.user.email?.split('@')[0] || 'pengguna' })
      setAuthChecked(true)
    }

    periksaSesi()

    // Ambil subscription dengan destructuring Supabase v2 yang benar
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: string, session: any) => {
      if (!mounted) return
      if (!session) {
        setUser(null)
        setAuthChecked(false)
        router.replace('/login')
      } else {
        setUser({ id: session.user.id, name: session.user.email?.split('@')[0] || 'pengguna' })
        setAuthChecked(true)
      }
    })

    return () => { mounted = false; subscription?.unsubscribe() }
  }, [router])

  // Pastikan data baru diambil ketika auth sukses dan ID user valid
  useEffect(() => { 
    if (authChecked && user?.id) {
      ambilData() 
    }
  }, [authChecked, user?.id])

  async function logout() {
    await supabase.auth.signOut()
    router.replace('/login')
  }

  async function ambilData() {
    if (!user?.id) return
    setLoading(true)
    // Ditambahkan filter .eq('user_id', user.id) agar data sesuai akun masing-masing
    const { data, error } = await supabase
      .from('elmon')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) { notify('Gagal memuat data: ' + error.message, 'error') }
    setCatatan(data || [])
    setLoading(false)
  }

  async function handleSave(data: { judul: string, isi: string, tipe: 'catatan' | 'dokumen' | 'tautan', link: string, file?: File | null }) {
    setSaving(true)
    let finalLink = data.link

    if (data.file && data.tipe === 'dokumen') {
      if (data.file.size > 10 * 1024 * 1024) {
        notify('Ukuran berkas maksimal 10MB', 'error')
        setSaving(false)
        return
      }
      try {
        const fileExt = data.file.name.split('.').pop()
        const fileName = `${Date.now()}_${Math.random().toString(36).slice(2)}.${fileExt}`
        const filePath = `documents/${user?.id}/${fileName}`

        const { error: uploadError } = await supabase.storage.from('elmon-files').upload(filePath, data.file)
        if (uploadError) {
          notify('Gagal unggah berkas: ' + uploadError.message, 'error')
          setSaving(false)
          return
        }
        const { data: urlData } = supabase.storage.from('elmon-files').getPublicUrl(filePath)
        finalLink = urlData.publicUrl
      } catch (err: any) {
        notify('Terjadi kesalahan saat unggah berkas', 'error')
        setSaving(false)
        return
      }
    }

    if (editingId) {
      const { error } = await supabase.from('elmon').update({ judul: data.judul, isi: data.isi, kategori: data.tipe, link: finalLink }).eq('id', editingId)
      if (error) notify('Gagal menyimpan perubahan: ' + error.message, 'error')
      else notify('Perubahan disimpan', 'success')
    } else {
      const { error } = await supabase.from('elmon').insert([{ judul: data.judul, isi: data.isi, kategori: data.tipe, link: finalLink, favorite: false, user_id: user?.id }])
      if (error) notify('Gagal menyimpan entri: ' + error.message, 'error')
      else notify('Entri baru ditambahkan', 'success')
    }

    setIsModalOpen(false)
    setEditingId(null)
    setSaving(false)
    ambilData()
  }

  function requestDelete(item: any) {
    setDetailItem(null)
    setConfirmDeleteItem(item)
  }

  async function confirmDelete() {
    if (!confirmDeleteItem) return
    const { error } = await supabase.from('elmon').delete().eq('id', confirmDeleteItem.id)
    if (error) notify('Gagal menghapus: ' + error.message, 'error')
    else notify('Entri dihapus', 'success')
    setConfirmDeleteItem(null)
    ambilData()
  }

  async function toggleFavorite(id: string, currentStatus: boolean) {
    await supabase.from('elmon').update({ favorite: !currentStatus }).eq('id', id)
    ambilData()
  }

  function openEditModal(item: any) {
    setDetailItem(null)
    setEditingId(item.id)
    setInitialModalData({ judul: item.judul, isi: item.isi, kategori: item.kategori, link: item.link || '' })
    setIsModalOpen(true)
  }

  const catalogIndexMap = new Map<string, number>()
  ;[...catatan].reverse().forEach((item, i) => catalogIndexMap.set(item.id, i + 1))

  const catatanDiFilter = catatan
    .filter(item => tabAktif === 'semua' || (item.kategori || 'catatan') === tabAktif)
    .filter(c => filterFavorit ? c.favorite : true)
    .filter(item => item.judul?.toLowerCase().includes(searchTerm.toLowerCase()) || item.isi?.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === 'judul') return (a.judul || '').localeCompare(b.judul || '')
      if (sortBy === 'terlama') return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })

  const stats = {
    total: catatan.length,
    catatan: catatan.filter(c => c.kategori === 'catatan').length,
    dokumen: catatan.filter(c => c.kategori === 'dokumen').length,
    tautan: catatan.filter(c => c.kategori === 'tautan').length,
    favorit: catatan.filter(c => c.favorite).length
  }

  const getCategoryColor = (kategori: string) => {
    const colors: any = { catatan: '#1F6F5C', dokumen: '#8B5E34', tautan: '#3B5573' }
    return colors[kategori] || '#1F6F5C'
  }
  const getCategoryIcon = (kategori: string) => {
    const icons: any = { catatan: '✎', dokumen: '▤', tautan: '⛓' }
    return icons[kategori] || '✎'
  }

  const shelf = [
    { key: 'catatan', label: 'Catatan', value: stats.catatan, color: getCategoryColor('catatan') },
    { key: 'dokumen', label: 'Dokumen', value: stats.dokumen, color: getCategoryColor('dokumen') },
    { key: 'tautan', label: 'Tautan', value: stats.tautan, color: getCategoryColor('tautan') },
  ]
  const shelfMax = Math.max(1, ...shelf.map(s => s.value))

  if (!authChecked) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#EFEDE4', fontFamily: '"JetBrains Mono", monospace', color: '#6B6558', fontSize: '0.85rem' }}>
        memeriksa sesi...
      </div>
    )
  }

  return (
    <div style={{ height: '100vh', background: '#EFEDE4', color: '#1C2420', display: 'flex', overflow: 'hidden', fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,500;0,600;0,700;1,500&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;700&display=swap');
        * { box-sizing: border-box; }
        ::selection { background: #1F6F5C; color: #fff; }
        .sidebar {
          width: 254px; background: #16221F; display: flex; flex-direction: column; flex-shrink: 0;
          transition: transform 220ms ease; z-index: 500;
        }
        .sidebar-item {
          padding: 9px 16px; margin: 1px 12px; border-radius: 2px; cursor: pointer; display: flex;
          align-items: center; justify-content: space-between; gap: 10px; color: #9FB0AB; font-size: 0.85rem;
          font-weight: 500; transition: background 120ms ease, color 120ms ease, border-color 120ms ease; border-left: 2px solid transparent;
        }
        .sidebar-item:hover { background: #1D2C28; color: #F5F2EA; }
        .sidebar-item.active { background: #1D2C28; color: #F5F2EA; border-left: 2px solid #4E9B85; }
        .sidebar-left { display: flex; align-items: center; gap: 10px; flex: 1; min-width: 0; }
        .count-tag { font-family: "JetBrains Mono", monospace; font-size: 0.7rem; color: #6E8B83; }
        .sidebar-item.active .count-tag { color: #C7DAD4; }
        .main-content { flex: 1; padding: 30px 34px 34px; overflow-y: auto; }
        .topbar { display: flex; justify-content: space-between; align-items: center; gap: 16px; flex-wrap: wrap; margin-bottom: 24px; }
        .search-input {
          width: 100%; background: transparent; border: none; border-bottom: 1px solid #C9C3B0; padding: 8px 4px 8px 22px;
          color: #1C2420; font-size: 0.87rem; outline: none; transition: border-color 120ms ease;
        }
        .search-input:focus { border-color: #1F6F5C; }
        .sort-select {
          background: transparent; border: 1px solid #DEDACC; border-radius: 3px; padding: 8px 10px;
          color: #4A473D; font-size: 0.8rem; font-weight: 600; cursor: pointer; outline: none;
        }
        .btn-primary { background: #1F6F5C; color: #FBFAF6; border: none; padding: 9px 16px; border-radius: 3px; cursor: pointer; font-size: 0.83rem; font-weight: 600; }
        .btn-primary:hover { background: #185848; }
        .grid-layout { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px; }
        .ledger-card { background: #FBFAF6; border: 1px solid #DEDACC; border-radius: 3px; padding: 18px 20px; }
        .hamburger { display: none; background: transparent; border: 1px solid #DEDACC; border-radius: 3px; width: 36px; height: 36px; cursor: pointer; font-size: 1rem; color: #4A473D; }
        .sidebar-backdrop { display: none; }

        @media (max-width: 820px) {
          .sidebar { position: fixed; inset: 0 auto 0 0; transform: translateX(-100%); }
          .sidebar.open { transform: translateX(0); }
          .main-content { padding: 20px 16px 28px; }
          .hamburger { display: inline-flex; align-items: center; justify-content: center; }
          .sidebar-backdrop.open { display: block; position: fixed; inset: 0; background: rgba(20,25,22,0.5); z-index: 400; }
          .stats-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      <div className={`sidebar-backdrop ${sidebarOpen ? 'open' : ''}`} onClick={() => setSidebarOpen(false)} />

      {/* SIDEBAR */}
      <div className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div style={{ padding: '24px 22px 18px' }}>
          <div style={{ fontFamily: '"Fraunces", Georgia, serif', fontStyle: 'italic', fontSize: '1.35rem', fontWeight: 600, color: '#F5F2EA', letterSpacing: '-0.01em' }}>
            NexaHub
          </div>
          <div style={{ height: '1px', background: '#2A3A36', margin: '10px 0 8px' }} />
          <div style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: '0.64rem', color: '#5E7A72', letterSpacing: '0.05em' }}>
            ARSIP PRIBADI · {String(stats.total).padStart(3, '0')} ENTRI
          </div>
        </div>

        <div style={{ flex: 1, padding: '10px 0', overflowY: 'auto' }}>
          {NAV_ITEMS.map((t) => (
            <div key={t.key} onClick={() => { setTabAktif(t.key); setSidebarOpen(false) }} className={`sidebar-item ${tabAktif === t.key ? 'active' : ''}`}>
              <div className="sidebar-left">
                <span style={{ fontSize: '0.95em', width: '16px', textAlign: 'center' }}>{t.icon}</span>
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.label}</span>
              </div>
              <span className="count-tag">{String(t.key === 'semua' ? stats.total : (stats as any)[t.key]).padStart(2, '0')}</span>
            </div>
          ))}
        </div>

        <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #223330' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
            <div style={{ width: '30px', height: '30px', borderRadius: '2px', background: '#1F6F5C', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.8rem', color: '#FBFAF6', flexShrink: 0 }}>
              {(user?.name || '?').charAt(0).toUpperCase()}
            </div>
            <div style={{ fontSize: '0.78rem', fontWeight: 600, color: '#E7E3D6', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.name}</div>
          </div>
          <button onClick={logout} title="Keluar" style={{ background: 'transparent', color: '#8FA69E', border: '1px solid #2A3A36', width: '28px', height: '28px', borderRadius: '2px', cursor: 'pointer', fontSize: '0.8rem', flexShrink: 0 }}>↪</button>
        </div>
      </div>

      {/* MAIN */}
      <div className="main-content">
        {/* Header */}
        <div style={{ marginBottom: '24px', display: 'flex', justifycontent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: '0.68rem', color: '#8B8672', letterSpacing: '0.06em', marginBottom: '8px' }}>
              KATALOG — {new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}
            </div>
            <h1 style={{ color: '#1C2420', fontSize: '1.9rem', margin: 0, letterSpacing: '-0.01em', fontFamily: '"Fraunces", Georgia, serif', fontWeight: 600 }}>
              Selamat datang kembali
            </h1>
          </div>
          <button className="hamburger" onClick={() => setSidebarOpen(true)} aria-label="Buka menu">☰</button>
        </div>

        {/* Stats */}
        <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'minmax(260px, 1.4fr) minmax(160px, 1fr)', gap: '14px', marginBottom: '24px' }}>
          <div className="ledger-card">
            <div style={{ fontSize: '0.7rem', color: '#8B8672', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '14px' }}>Komposisi arsip</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {shelf.map(s => (
                <div key={s.key} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ width: '62px', fontSize: '0.78rem', color: '#4A473D', fontWeight: 600, flexShrink: 0 }}>{s.label}</span>
                  <div style={{ flex: 1, background: '#EFEDE4', borderRadius: '2px', height: '10px', overflow: 'hidden' }}>
                    <div style={{ width: `${(s.value / shelfMax) * 100}%`, background: s.color, height: '100%', borderRadius: '2px', transition: 'width 300ms ease' }} />
                  </div>
                  <span style={{ width: '24px', textAlign: 'right', fontFamily: '"JetBrains Mono", monospace', fontSize: '0.78rem', color: '#1C2420', fontWeight: 600, flexShrink: 0 }}>{s.value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="ledger-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div style={{ fontSize: '0.7rem', color: '#8B8672', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Total entri</div>
            <div style={{ fontFamily: '"Fraunces", Georgia, serif', fontSize: '2.6rem', fontWeight: 600, color: '#1C2420', lineHeight: 1 }}>{stats.total}</div>
            <div style={{ fontSize: '0.75rem', color: '#8B5E34', fontWeight: 600 }}>★ {stats.favorit} ditandai favorit</div>
          </div>
        </div>

        {/* Controls */}
        <div className="topbar">
          <div style={{ flex: 1, maxWidth: '360px', position: 'relative' }}>
            <span style={{ position: 'absolute', left: '2px', top: '50%', transform: 'translateY(-50%)', color: '#9B9483', fontSize: '0.85rem' }}>⌕</span>
            <input className="search-input" placeholder="Cari judul atau isi..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <select className="sort-select" value={sortBy} onChange={(e) => setSortBy(e.target.value as any)}>
              {SORT_OPTIONS.map(o => <option key={o.key} value={o.key}>{o.label}</option>)}
            </select>
            <button
              onClick={() => setFilterFavorit(!filterFavorit)}
              style={{
                background: filterFavorit ? '#F3E8DA' : 'transparent', color: filterFavorit ? '#8B5E34' : '#4A473D',
                border: `1px solid ${filterFavorit ? '#D9C4A5' : '#DEDACC'}`, padding: '9px 14px', borderRadius: '3px',
                cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600,
              }}
            >
              {filterFavorit ? '★ Favorit' : '☆ Favorit'}
            </button>
            <button className="btn-primary" onClick={() => { setEditingId(null); setInitialModalData(null); setIsModalOpen(true) }}>+ Tambah entri</button>
          </div>
        </div>

        {/* Grid */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#9B9483', fontSize: '0.85rem', fontFamily: '"JetBrains Mono", monospace' }}>memuat arsip...</div>
        ) : catatanDiFilter.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '56px 20px', color: '#8B8672', background: '#FBFAF6', border: '1px dashed #DEDACC', borderRadius: '3px' }}>
            <div style={{ fontFamily: '"Fraunces", Georgia, serif', fontStyle: 'italic', fontSize: '1.3rem', color: '#4A473D', marginBottom: '6px' }}>
              {catatan.length === 0 ? 'Rak ini masih kosong' : 'Tidak ada hasil'}
            </div>
            <p style={{ fontSize: '0.85rem', margin: 0 }}>
              {catatan.length === 0 ? 'Klik "Tambah entri" untuk mengisi arsip pertama.' : 'Coba ubah kata kunci atau filter pencarian.'}
            </p>
          </div>
        ) : (
          <div className="grid-layout">
            {catatanDiFilter.map((item) => (
              <CardSimple
                key={item.id}
                item={item}
                catalogNo={catalogIndexMap.get(item.id)}
                onDelete={requestDelete}
                onEdit={openEditModal}
                onFavorite={toggleFavorite}
                onOpen={setDetailItem}
                getCategoryColor={getCategoryColor}
                getCategoryIcon={getCategoryIcon}
              />
            ))}
          </div>
        )}
      </div>

      {/* DETAIL */}
      <DetailModal
        item={detailItem}
        onClose={() => setDetailItem(null)}
        onEdit={openEditModal}
        onDelete={requestDelete}
        onFavorite={toggleFavorite}
        getCategoryColor={getCategoryColor}
        getCategoryIcon={getCategoryIcon}
        catalogNo={detailItem ? catalogIndexMap.get(detailItem.id) : undefined}
      />

      {/* KONFIRMASI HAPUS */}
      <ConfirmDialog
        open={!!confirmDeleteItem}
        title="Hapus entri ini?"
        description={confirmDeleteItem ? `"${confirmDeleteItem.judul}" akan dihapus permanen dari arsip. Tindakan ini tidak bisa dibatalkan.` : ''}
        confirmLabel="Ya, hapus"
        onConfirm={confirmDelete}
        onCancel={() => setConfirmDeleteItem(null)}
      />

      {/* MODAL TAMBAH/EDIT */}
      <ModalSimple
        isOpen={isModalOpen}
        onClose={() => !saving && setIsModalOpen(false)}
        onSave={handleSave}
        editingId={editingId}
        initialData={initialModalData}
        getCategoryIcon={getCategoryIcon}
        saving={saving}
      />

      {/* TOAST */}
      <ToastStack toasts={toasts} onDismiss={dismissToast} />
    </div>
  )
}