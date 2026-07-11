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

  useEffect(() => {
    let mounted = true
    supabase.auth.getSession().then(({ data }: any) => {
      if (!mounted) return
      if (!data.session) {
        router.replace('/login')
        return
      }
      setUser({ id: data.session.user.id, name: data.session.user.email?.split('@')[0] || 'pengguna' })
      setAuthChecked(true)
    })
    const { data: listener } = supabase.auth.onAuthStateChange((_event: string, session: any) => {
      if (!session) {
        router.replace('/login')
      } else {
        setUser({ id: session.user.id, name: session.user.email?.split('@')[0] || 'pengguna' })
      }
    })
    return () => { mounted = false; listener?.subscription?.unsubscribe() }
  }, [router])

  useEffect(() => { if (authChecked) ambilData() }, [authChecked])

  async function logout() {
    await supabase.auth.signOut()
    router.replace('/login')
  }

  async function ambilData() {
    setLoading(true)
    const { data, error } = await supabase.from('elmon').select('*').order('created_at', { ascending: false })
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
  }

  const getCategoryColor = (kategori: string) => {
    const colors: any = { catatan: '#1F6F5C', dokumen: '#8B5E34', tautan: '#3B5573' }
    return colors[kategori] || '#1F6F5C'
  }
  const getCategoryIcon = (kategori: string) => {
    const icons: any = { catatan: '✎', dokumen: '▤', tautan: '⛓' }
    return icons[kategori] || '✎'
  }

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
        .sidebar { width: 254px; background: #16221F; display: flex; flex-direction: column; flex-shrink: 0; }
        .sidebar-item { padding: 9px 16px; margin: 1px 12px; border-radius: 2px; cursor: pointer; display: flex; align-items: center; justify-content: space-between; gap: 10px; color: #9FB0AB; font-size: 0.85rem; font-weight: 500; transition: background 120ms ease, color 120ms ease; border-left: 2px solid transparent; }
        .sidebar-item:hover { background: #1D2C28; color: #F5F2EA; }
        .sidebar-item.active { background: #1D2C28; color: #F5F2EA; border-left: 2px solid #4E9B85; }
        .main-content { flex: 1; padding: 30px 34px 34px; overflow-y: auto; }
        .topbar { display: flex; justify-content: space-between; align-items: center; gap: 16px; flex-wrap: wrap; margin-bottom: 24px; }
        .search-input { width: 100%; background: transparent; border: none; border-bottom: 1px solid #C9C3B0; padding: 8px 4px 8px 22px; color: #1C2420; font-size: 0.87rem; outline: none; }
        .search-input:focus { border-color: #1F6F5C; }
        .sort-select { background: transparent; border: 1px solid #DEDACC; border-radius: 3px; padding: 8px 10px; color: #4A473D; font-size: 0.8rem; font-weight: 600; cursor: pointer; }
        .btn-primary { background: #1F6F5C; color: #FBFAF6; border: none; padding: 9px 16px; border-radius: 3px; cursor: pointer; font-size: 0.83rem; font-weight: 600; }
        .grid-layout { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px; }
      `}</style>

      <aside className="sidebar">
        <div style={{ padding: '24px 16px', color: '#F5F2EA', fontWeight: 600, fontSize: '0.95rem' }}>MyArchive</div>
        <div style={{ flex: 1 }}>
          {NAV_ITEMS.map((item) => (
            <div key={item.key} className={`sidebar-item ${tabAktif === item.key ? 'active' : ''}`} onClick={() => setTabAktif(item.key as any)}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><span>{item.icon}</span>{item.label}</div>
              <span style={{ fontSize: '0.7rem', color: '#6E8B83' }}>{item.key === 'semua' ? stats.total : stats[item.key as keyof typeof stats]}</span>
            </div>
          ))}
        </div>
        <button onClick={logout} className="sidebar-item" style={{ marginTop: 'auto', marginBottom: '20px' }}>Keluar</button>
      </aside>

      <main className="main-content">
        <div className="topbar">
          <input className="search-input" placeholder="Cari arsip..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          <select className="sort-select" value={sortBy} onChange={(e) => setSortBy(e.target.value as any)}>
            {SORT_OPTIONS.map(o => <option key={o.key} value={o.key}>{o.label}</option>)}
          </select>
          <button className="btn-primary" onClick={() => { setInitialModalData(null); setEditingId(null); setIsModalOpen(true); }}>+ Tambah Baru</button>
        </div>

        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#9B9483' }}>Memuat arsip...</div>
        ) : (
          <div className="grid-layout">
            {catatanDiFilter.map((item) => (
              <CardSimple key={item.id} item={item} catalogNo={catalogIndexMap.get(item.id)} onDelete={requestDelete} onEdit={openEditModal} onFavorite={toggleFavorite} onOpen={setDetailItem} getCategoryColor={getCategoryColor} getCategoryIcon={getCategoryIcon} />
            ))}
          </div>
        )}
      </main>

      <ModalSimple isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={handleSave} editingId={editingId} initialData={initialModalData} saving={saving} getCategoryIcon={getCategoryIcon} />
      <DetailModal item={detailItem} onClose={() => setDetailItem(null)} onDelete={requestDelete} onEdit={openEditModal} onFavorite={toggleFavorite} catalogNo={detailItem ? catalogIndexMap.get(detailItem.id) : 0} getCategoryColor={getCategoryColor} getCategoryIcon={getCategoryIcon} />
      <ConfirmDialog open={!!confirmDeleteItem} title="Hapus entri?" description="Data akan dihapus permanen dari arsip." onConfirm={confirmDelete} onCancel={() => setConfirmDeleteItem(null)} />
      <ToastStack toasts={toasts} onDismiss={dismissToast} />
    </div>
  )
}