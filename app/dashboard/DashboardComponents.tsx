'use client'

import { useState, useRef, useEffect } from 'react'

const CATEGORY_META: Record<string, { label: string; color: string; icon: string }> = {
  catatan: { label: 'Catatan', color: '#1F6F5C', icon: '✎' },
  dokumen: { label: 'Dokumen', color: '#8B5E34', icon: '▤' },
  tautan: { label: 'Tautan', color: '#3B5573', icon: '⛓' },
}

function formatTanggal(dateStr?: string) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return ''
  return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / 1048576).toFixed(1) + ' MB'
}

export function CardSimple({ item, onDelete, onEdit, onFavorite, onOpen, getCategoryColor, getCategoryIcon, catalogNo }: any) {
  const [hover, setHover] = useState(false)
  const meta = CATEGORY_META[item.kategori] || CATEGORY_META.catatan
  const color = getCategoryColor ? getCategoryColor(item.kategori) : meta.color
  const icon = getCategoryIcon ? getCategoryIcon(item.kategori) : meta.icon

  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onClick={() => onOpen && onOpen(item)}
      style={{
        background: '#FFFFFE',
        border: '1px solid #DEDACC',
        borderRadius: '3px',
        padding: '18px 20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        position: 'relative',
        cursor: onOpen ? 'pointer' : 'default',
        boxShadow: hover ? '0 10px 22px rgba(28,36,32,0.10)' : '0 1px 0 rgba(28,36,32,0.03)',
        transform: hover ? 'translateY(-3px)' : 'none',
        transition: 'box-shadow 180ms ease, transform 180ms ease, border-color 180ms ease',
        borderColor: hover ? color : '#DEDACC',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontFamily: '"JetBrains Mono", ui-monospace, monospace', fontSize: '0.68rem', color: '#9B9483', letterSpacing: '0.03em' }}>
          N° {String(catalogNo ?? '').padStart(3, '0')}
        </span>
        <button
          onClick={(e) => { e.stopPropagation(); onFavorite(item.id, item.favorite) }}
          aria-label={item.favorite ? 'Hapus dari favorit' : 'Tandai favorit'}
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.05rem', lineHeight: 1, color: item.favorite ? '#8B5E34' : '#D4CFC0', padding: 0 }}
        >
          {item.favorite ? '★' : '☆'}
        </button>
      </div>

      <div style={{
        display: 'inline-flex', alignItems: 'center', gap: '6px', color, fontSize: '0.68rem', fontWeight: 700,
        letterSpacing: '0.08em', textTransform: 'uppercase', borderBottom: `2px solid ${color}`, paddingBottom: '3px', width: 'fit-content',
      }}>
        <span aria-hidden>{icon}</span>
        {item.kategori ? item.kategori.charAt(0).toUpperCase() + item.kategori.slice(1) : 'Catatan'}
      </div>

      <h3 style={{ margin: '2px 0 0 0', color: '#1C2420', fontFamily: '"Fraunces", Georgia, serif', fontSize: '1.15rem', fontWeight: 600, lineHeight: 1.3 }}>
        {item.judul}
      </h3>

      <p style={{
        margin: 0, fontSize: '0.85rem', color: '#6B6558', lineHeight: 1.6,
        display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' as any, overflow: 'hidden', minHeight: '4em',
      }}>
        {item.isi}
      </p>

      {item.link && item.kategori === 'dokumen' && (
        <a
          href={item.link} target="_blank" rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 10px', background: '#F5F2EA',
            border: '1px solid #DEDACC', borderRadius: '3px', color: '#8B5E34', fontSize: '0.72rem',
            fontFamily: '"JetBrains Mono", monospace', textDecoration: 'none', width: 'fit-content',
          }}
        >
          <span>📎</span><span>Lihat Dokumen</span>
        </a>
      )}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '10px', marginTop: '2px', borderTop: '1px dashed #DEDACC' }}>
        <span style={{ fontFamily: '"JetBrains Mono", ui-monospace, monospace', fontSize: '0.68rem', color: '#9B9483' }}>
          {formatTanggal(item.created_at) || 'baru saja'}
        </span>
        <div style={{ display: 'flex', gap: '4px', opacity: hover ? 1 : 0.55, transition: 'opacity 150ms ease' }}>
          <button
            onClick={(e) => { e.stopPropagation(); onEdit(item) }}
            aria-label="Edit"
            style={{ background: 'transparent', color: '#6B6558', border: '1px solid #DEDACC', width: '28px', height: '28px', borderRadius: '3px', cursor: 'pointer', fontSize: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >✎</button>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(item) }}
            aria-label="Hapus"
            style={{ background: 'transparent', color: '#A03A3A', border: '1px solid #E9D3D3', width: '28px', height: '28px', borderRadius: '3px', cursor: 'pointer', fontSize: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >✕</button>
        </div>
      </div>
    </div>
  )
}

export function DetailModal({ item, onClose, onEdit, onDelete, onFavorite, getCategoryColor, getCategoryIcon, catalogNo }: any) {
  if (!item) return null
  const color = getCategoryColor ? getCategoryColor(item.kategori) : '#1F6F5C'
  const icon = getCategoryIcon ? getCategoryIcon(item.kategori) : '✎'

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(20,25,22,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ background: '#FBFAF6', borderRadius: '4px', width: '100%', maxWidth: '560px', border: '1px solid #DEDACC', boxShadow: '0 24px 60px rgba(20,25,22,0.28)', maxHeight: '86vh', overflowY: 'auto' }}
      >
        <div style={{ padding: '26px 28px 18px', borderBottom: '1px solid #DEDACC' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
            <span style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: '0.68rem', color: '#9B9483' }}>N° {String(catalogNo ?? '').padStart(3, '0')}</span>
            <button onClick={onClose} aria-label="Tutup" style={{ background: 'transparent', border: '1px solid #DEDACC', width: '26px', height: '26px', borderRadius: '3px', cursor: 'pointer', color: '#6B6558' }}>✕</button>
          </div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color, fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', borderBottom: `2px solid ${color}`, paddingBottom: '3px', marginBottom: '10px' }}>
            <span>{icon}</span>{item.kategori}
          </div>
          <h2 style={{ margin: 0, fontFamily: '"Fraunces", Georgia, serif', fontSize: '1.5rem', fontWeight: 600, color: '#1C2420', lineHeight: 1.3 }}>{item.judul}</h2>
        </div>

        <div style={{ padding: '22px 28px' }}>
          <p style={{ margin: 0, fontSize: '0.92rem', color: '#3F3C33', lineHeight: 1.75, whiteSpace: 'pre-wrap' }}>{item.isi}</p>
          {item.link && (
            <a href={item.link} target="_blank" rel="noopener noreferrer" style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px', marginTop: '16px', padding: '8px 12px',
              background: '#F5F2EA', border: '1px solid #DEDACC', borderRadius: '3px', color: '#8B5E34',
              fontSize: '0.78rem', fontFamily: '"JetBrains Mono", monospace', textDecoration: 'none', width: 'fit-content',
            }}>
              📎 {item.kategori === 'tautan' ? 'Buka tautan' : 'Lihat dokumen'}
            </a>
          )}
          <div style={{ fontSize: '0.72rem', color: '#9B9483', fontFamily: '"JetBrains Mono", monospace', marginTop: '18px' }}>
            Dibuat {formatTanggal(item.created_at) || 'baru saja'}
          </div>
        </div>

        <div style={{ padding: '16px 28px', borderTop: '1px solid #DEDACC', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button
            onClick={() => onFavorite(item.id, item.favorite)}
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '1.1rem', color: item.favorite ? '#8B5E34' : '#D4CFC0' }}
          >
            {item.favorite ? '★ Favorit' : '☆ Tandai favorit'}
          </button>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={() => onDelete(item)} style={{ padding: '8px 14px', background: 'transparent', color: '#A03A3A', border: '1px solid #E9D3D3', borderRadius: '3px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}>Hapus</button>
            <button onClick={() => onEdit(item)} style={{ padding: '8px 16px', background: '#1F6F5C', color: '#FBFAF6', border: 'none', borderRadius: '3px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 700 }}>Edit entri</button>
          </div>
        </div>
      </div>
    </div>
  )
}

export function ConfirmDialog({ open, title, description, confirmLabel = 'Hapus', onConfirm, onCancel }: any) {
  if (!open) return null
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(20,25,22,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1200, padding: '16px' }} onClick={onCancel}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: '#FBFAF6', border: '1px solid #DEDACC', borderRadius: '4px', padding: '24px', width: '100%', maxWidth: '360px', boxShadow: '0 24px 60px rgba(20,25,22,0.28)' }}>
        <h3 style={{ margin: '0 0 8px 0', fontFamily: '"Fraunces", Georgia, serif', fontSize: '1.15rem', fontWeight: 600, color: '#1C2420' }}>{title}</h3>
        <p style={{ margin: '0 0 20px 0', fontSize: '0.85rem', color: '#6B6558', lineHeight: 1.5 }}>{description}</p>
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
          <button onClick={onCancel} style={{ padding: '9px 14px', background: 'transparent', color: '#6B6558', border: '1px solid #DEDACC', borderRadius: '3px', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600 }}>Batal</button>
          <button onClick={onConfirm} style={{ padding: '9px 16px', background: '#A03A3A', color: '#FBFAF6', border: 'none', borderRadius: '3px', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 700 }}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  )
}

export type Toast = { id: number; message: string; type?: 'success' | 'error' | 'info' }

export function ToastStack({ toasts, onDismiss }: { toasts: Toast[]; onDismiss: (id: number) => void }) {
  return (
    <div style={{ position: 'fixed', bottom: '20px', right: '20px', display: 'flex', flexDirection: 'column', gap: '8px', zIndex: 1300 }}>
      {toasts.map(t => <ToastItem key={t.id} toast={t} onDismiss={onDismiss} />)}
    </div>
  )
}

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: (id: number) => void }) {
  useEffect(() => {
    const timer = setTimeout(() => onDismiss(toast.id), 3500)
    return () => clearTimeout(timer)
  }, [toast.id])

  const colors: any = {
    success: { bg: '#EAF3EF', border: '#B9D8CC', text: '#1F6F5C', icon: '✓' },
    error: { bg: '#FBEEEE', border: '#E9C4C4', text: '#A03A3A', icon: '✕' },
    info: { bg: '#F5F2EA', border: '#DEDACC', text: '#4A473D', icon: 'ℹ' },
  }
  const c = colors[toast.type || 'info']

  return (
    <div style={{
      background: c.bg, border: `1px solid ${c.border}`, color: c.text, borderRadius: '3px',
      padding: '11px 14px', fontSize: '0.83rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px',
      minWidth: '220px', maxWidth: '340px', boxShadow: '0 8px 20px rgba(20,25,22,0.15)',
    }}>
      <span>{c.icon}</span>
      <span style={{ flex: 1 }}>{toast.message}</span>
      <button onClick={() => onDismiss(toast.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: c.text, opacity: 0.6, fontSize: '0.75rem' }}>✕</button>
    </div>
  )
}

export function ModalSimple({ isOpen, onClose, onSave, editingId, initialData, getCategoryIcon, saving }: any) {
  const [tipeKonten, setTipeKonten] = useState<'catatan' | 'dokumen' | 'tautan'>('catatan')
  const [judulBaru, setJudulBaru] = useState('')
  const [isiBaru, setIsiBaru] = useState('')
  const [linkAtauFileUrl, setLinkAtauFileUrl] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isOpen) {
      setTipeKonten(initialData?.kategori || 'catatan')
      setJudulBaru(initialData?.judul || '')
      setIsiBaru(initialData?.isi || '')
      setLinkAtauFileUrl(initialData?.link || '')
      setSelectedFile(null)
    }
  }, [isOpen, initialData])

  if (!isOpen) return null

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) { setSelectedFile(file); setLinkAtauFileUrl('') }
  }
  const handleRemoveFile = () => {
    setSelectedFile(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave({ judul: judulBaru, isi: isiBaru, tipe: tipeKonten, link: linkAtauFileUrl, file: selectedFile })
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 12px', background: '#FBFAF6', color: '#1C2420', border: '1px solid #DEDACC',
    borderRadius: '3px', fontSize: '0.88rem', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit',
  }
  const labelStyle: React.CSSProperties = {
    display: 'block', marginBottom: '6px', color: '#4A473D', fontSize: '0.72rem', fontWeight: 700,
    textTransform: 'uppercase', letterSpacing: '0.06em',
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(20,25,22,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: '#FBFAF6', padding: '28px', borderRadius: '4px', width: '100%', maxWidth: '460px', border: '1px solid #DEDACC', boxShadow: '0 24px 60px rgba(20,25,22,0.28)', maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ marginBottom: '20px', borderBottom: '2px solid #1C2420', paddingBottom: '14px' }}>
          <div style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: '0.65rem', color: '#9B9483', marginBottom: '4px', letterSpacing: '0.06em' }}>
            {editingId ? 'EDIT ENTRI' : 'ENTRI BARU'}
          </div>
          <h3 style={{ color: '#1C2420', margin: 0, fontFamily: '"Fraunces", Georgia, serif', fontSize: '1.3rem', fontWeight: 600 }}>
            {editingId ? 'Perbarui arsip' : 'Tambah ke arsip'}
          </h3>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '16px' }}>
            <label style={labelStyle}>Tipe</label>
            <div style={{ display: 'flex', gap: '6px' }}>
              {(['catatan', 'dokumen', 'tautan'] as const).map((t) => {
                const active = tipeKonten === t
                return (
                  <button key={t} type="button" onClick={() => setTipeKonten(t)} style={{
                    flex: 1, padding: '9px 6px', background: active ? '#1C2420' : 'transparent', color: active ? '#F5F2EA' : '#6B6558',
                    border: `1px solid ${active ? '#1C2420' : '#DEDACC'}`, borderRadius: '3px', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600,
                  }}>
                    {(getCategoryIcon ? getCategoryIcon(t) : CATEGORY_META[t].icon)} {t.charAt(0).toUpperCase() + t.slice(1)}
                  </button>
                )
              })}
            </div>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={labelStyle}>Judul</label>
            <input value={judulBaru} onChange={(e) => setJudulBaru(e.target.value)} placeholder="Beri judul yang jelas..." required style={inputStyle} />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={labelStyle}>Isi</label>
            <textarea value={isiBaru} onChange={(e) => setIsiBaru(e.target.value)} placeholder="Tulis detailnya di sini..." rows={4} style={{ ...inputStyle, resize: 'vertical' }} />
          </div>

          {tipeKonten === 'dokumen' && (
            <div style={{ marginBottom: '16px' }}>
              <label style={labelStyle}>Unggah Berkas</label>
              {!selectedFile ? (
                <div>
                  <input ref={fileInputRef} type="file" onChange={handleFileChange}
                    accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif,.mp4,.mp3,.zip,.xlsx,.xls,.ppt,.pptx"
                    style={{ display: 'none' }} />
                  <button type="button" onClick={() => fileInputRef.current?.click()} style={{
                    width: '100%', padding: '16px', background: '#FBFAF6', border: '2px dashed #DEDACC', borderRadius: '3px',
                    color: '#6B6558', cursor: 'pointer', textAlign: 'center',
                  }}>
                    <div style={{ fontSize: '1.5rem', marginBottom: '6px' }}>▤</div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px' }}>Klik untuk memilih berkas</div>
                    <div style={{ fontSize: '0.7rem', color: '#9B9483', fontFamily: '"JetBrains Mono", monospace' }}>PDF, DOC, Images, dll. (maks 10MB)</div>
                  </button>
                </div>
              ) : (
                <div style={{ background: '#F5F2EA', border: '1px solid #8B5E34', borderRadius: '3px', padding: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: 0 }}>
                      <span style={{ fontSize: '1.5rem' }}>📄</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ margin: 0, fontSize: '0.85rem', color: '#1C2420', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{selectedFile.name}</p>
                        <p style={{ margin: '2px 0 0 0', fontSize: '0.7rem', color: '#9B9483', fontFamily: '"JetBrains Mono", monospace' }}>{formatFileSize(selectedFile.size)}</p>
                      </div>
                    </div>
                    <button type="button" onClick={handleRemoveFile} style={{ background: 'transparent', color: '#A03A3A', border: '1px solid #E9D3D3', width: '28px', height: '28px', borderRadius: '3px', cursor: 'pointer', fontSize: '0.75rem', flexShrink: 0 }}>✕</button>
                  </div>
                </div>
              )}
            </div>
          )}

          {tipeKonten === 'tautan' && (
            <div style={{ marginBottom: '20px' }}>
              <label style={labelStyle}>Link</label>
              <input value={linkAtauFileUrl} onChange={(e) => setLinkAtauFileUrl(e.target.value)} placeholder="https://..." style={inputStyle} />
            </div>
          )}

          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '6px' }}>
            <button type="button" onClick={onClose} disabled={saving} style={{ padding: '10px 16px', background: 'transparent', color: '#6B6558', border: '1px solid #DEDACC', borderRadius: '3px', cursor: 'pointer', fontSize: '0.83rem', fontWeight: 600 }}>Batal</button>
            <button type="submit" disabled={saving} style={{ padding: '10px 18px', background: '#1F6F5C', color: '#FBFAF6', border: 'none', borderRadius: '3px', cursor: saving ? 'default' : 'pointer', fontSize: '0.83rem', fontWeight: 700, opacity: saving ? 0.7 : 1 }}>
              {saving ? 'Menyimpan...' : (editingId ? 'Simpan perubahan' : 'Simpan ke arsip')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}