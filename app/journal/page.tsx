'use client'

import dynamic from 'next/dynamic'
import { useEffect, useState, useCallback, useRef } from 'react'
import { ILES } from '@/lib/constants'
import BottomSheet from '@/components/BottomSheet'
import FAB from '@/components/FAB'
import { supabase } from '@/lib/supabase'
import { apiFetch } from '@/lib/toast'
import {
  type JournalPost, type JournalTrack, type Auteur,
  AUTEURS, AUTEUR_AVATAR,
  getAuteurLocal, setAuteurLocal,
  formatDateVoyage, formatHeure, jourDuVoyage,
  getPhotoUrl, fetchMeteo, getCurrentPosition,
  compressImage, ILE_COORDS, wmoToEmoji,
} from '@/lib/journal'
import {
  Heart, MessageCircle, MapPin, Trash2, Send,
  Camera, ImagePlus, X, Map, AlignLeft, Navigation,
  ChevronDown, ChevronUp,
} from 'lucide-react'

// JournalMap dynamique (Leaflet = client-side uniquement)
const JournalMap = dynamic(() => import('@/components/JournalMap'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full bg-sky-50 text-sky-400">
      <div className="text-center"><div className="text-4xl mb-2">🗺️</div><p className="text-sm font-semibold">Chargement...</p></div>
    </div>
  ),
})

// ─────────────────────────────────────────────────────────
// Composant principal
// ─────────────────────────────────────────────────────────

export default function JournalPage() {
  const [posts, setPosts] = useState<JournalPost[]>([])
  const [tracks, setTracks] = useState<JournalTrack[]>([])
  const [loading, setLoading] = useState(true)
  const [vue, setVue] = useState<'timeline' | 'carte'>('timeline')
  const [filtreIle, setFiltreIle] = useState<string>('toutes')

  // Identité locale
  const [monNom, setMonNom] = useState<Auteur | null>(null)
  const [showIdentite, setShowIdentite] = useState(false)

  // Publish
  const [showPublish, setShowPublish] = useState(false)

  // Photo viewer plein écran
  const [viewer, setViewer] = useState<{ urls: string[]; idx: number } | null>(null)

  // Commentaires expandés
  const [commentsOpen, setCommentsOpen] = useState<Record<string, boolean>>({})

  const charger = useCallback(async () => {
    const [postsRes, tracksRes] = await Promise.all([
      fetch(filtreIle === 'toutes' ? '/api/journal' : `/api/journal?ile=${filtreIle}`).then(r => r.json()),
      fetch('/api/journal/tracks').then(r => r.json()),
    ])
    setPosts(postsRes ?? [])
    setTracks(tracksRes ?? [])
    setLoading(false)
  }, [filtreIle])

  useEffect(() => { charger() }, [charger])

  useEffect(() => {
    const saved = getAuteurLocal()
    if (saved) setMonNom(saved)
    else setShowIdentite(true)
  }, [])

  // Grouper posts par date_voyage
  const postsByDate = posts.reduce<Record<string, JournalPost[]>>((acc, p) => {
    if (!acc[p.date_voyage]) acc[p.date_voyage] = []
    acc[p.date_voyage].push(p)
    return acc
  }, {})
  const dates = Object.keys(postsByDate).sort((a, b) => b.localeCompare(a))

  async function toggleLike(postId: string) {
    if (!monNom) { setShowIdentite(true); return }
    const res = await fetch('/api/journal/likes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ post_id: postId, auteur: monNom }),
    })
    if (res.ok) {
      const { liked } = await res.json()
      setPosts(prev => prev.map(p => {
        if (p.id !== postId) return p
        const likes = liked
          ? [...p.likes, { id: Date.now().toString(), post_id: postId, auteur: monNom }]
          : p.likes.filter(l => l.auteur !== monNom)
        return { ...p, likes }
      }))
    }
  }

  async function supprimerPost(id: string) {
    if (!confirm('Supprimer ce souvenir définitivement ?')) return
    const { ok } = await apiFetch(`/api/journal?id=${id}`, { method: 'DELETE' })
    if (ok) setPosts(prev => prev.filter(p => p.id !== id))
  }

  function ouvrirViewer(photos: JournalPost['photos'], idx: number) {
    setViewer({ urls: photos.map(p => getPhotoUrl(p.storage_path)), idx })
  }

  if (loading) return <div className="flex items-center justify-center h-48 text-slate-400">Chargement...</div>

  return (
    <div className="pb-4">
      {/* ── Header ── */}
      <div className="px-5 pt-8 pb-3 flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-black text-slate-900">Journal</h1>
          <p className="text-slate-400 text-sm mt-0.5">{posts.length} souvenir{posts.length > 1 ? 's' : ''}</p>
        </div>
        {/* Toggle Timeline / Carte */}
        <div className="flex bg-slate-100 rounded-xl p-1 gap-1">
          <button onClick={() => setVue('timeline')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${vue === 'timeline' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'}`}>
            <AlignLeft size={14} /> Timeline
          </button>
          <button onClick={() => setVue('carte')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${vue === 'carte' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'}`}>
            <Map size={14} /> Carte
          </button>
        </div>
      </div>

      {/* ── Filtre îles ── */}
      <div className="flex gap-2 px-5 overflow-x-auto no-scrollbar pb-3">
        <button onClick={() => setFiltreIle('toutes')}
          className={`flex-shrink-0 px-4 py-2 rounded-full text-xs font-bold border transition-all ${filtreIle === 'toutes' ? 'bg-sky-600 text-white border-sky-600' : 'bg-white text-slate-500 border-slate-200'}`}>
          Toutes
        </button>
        {ILES.map(ile => (
          <button key={ile.slug} onClick={() => setFiltreIle(ile.slug)}
            className={`flex-shrink-0 px-4 py-2 rounded-full text-xs font-bold border transition-all ${filtreIle === ile.slug ? 'bg-sky-600 text-white border-sky-600' : 'bg-white text-slate-500 border-slate-200'}`}>
            {ile.emoji} {ile.nom}
          </button>
        ))}
      </div>

      {/* ── VUE CARTE ── */}
      {vue === 'carte' && (
        <div className="px-5 mb-4">
          <div className="h-[480px] rounded-2xl overflow-hidden border border-slate-100 shadow-md">
            <JournalMap posts={posts.filter(p => p.lat && p.lng)} tracks={tracks} />
          </div>
          <p className="text-xs text-slate-400 text-center mt-2">
            Tracé en pointillés · {tracks.length} position{tracks.length > 1 ? 's' : ''} enregistrée{tracks.length > 1 ? 's' : ''}
          </p>
        </div>
      )}

      {/* ── VUE TIMELINE ── */}
      {vue === 'timeline' && (
        <div className="px-5 space-y-6">
          {dates.length === 0 && (
            <div className="text-center py-20 text-slate-400">
              <p className="text-5xl mb-4">📖</p>
              <p className="font-bold text-slate-500 text-lg">Le journal est vide</p>
              <p className="text-sm mt-1">Le voyage commence le 4 septembre 2026.</p>
              <p className="text-sm">Publie le premier souvenir !</p>
            </div>
          )}

          {dates.map(date => (
            <div key={date}>
              {/* ── Séparateur de date ── */}
              <div className="flex items-center gap-3 mb-4">
                <div className="flex-1 h-px bg-slate-100" />
                <div className="flex-shrink-0 text-center">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                    {jourDuVoyage(date) > 0 ? `Jour ${jourDuVoyage(date)}` : ''}
                  </p>
                  <p className="text-sm font-bold text-slate-700 capitalize">
                    {formatDateVoyage(date)}
                  </p>
                </div>
                <div className="flex-1 h-px bg-slate-100" />
              </div>

              {/* ── Posts de la journée ── */}
              <div className="space-y-5">
                {postsByDate[date].map(post => (
                  <PostCard
                    key={post.id}
                    post={post}
                    monNom={monNom}
                    commentsOpen={!!commentsOpen[post.id]}
                    onToggleComments={() => setCommentsOpen(prev => ({ ...prev, [post.id]: !prev[post.id] }))}
                    onLike={() => toggleLike(post.id)}
                    onDelete={() => supprimerPost(post.id)}
                    onPhotoClick={(idx) => ouvrirViewer(post.photos, idx)}
                    onCommentAdded={(comment) => {
                      setPosts(prev => prev.map(p =>
                        p.id === post.id ? { ...p, comments: [...p.comments, comment] } : p
                      ))
                    }}
                    onCommentDeleted={(commentId) => {
                      setPosts(prev => prev.map(p =>
                        p.id === post.id ? { ...p, comments: p.comments.filter(c => c.id !== commentId) } : p
                      ))
                    }}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── FAB Publier ── */}
      <FAB onClick={() => {
        if (!monNom) { setShowIdentite(true); return }
        setShowPublish(true)
      }} label="Souvenir" />

      {/* ── Sélection identité ── */}
      {showIdentite && (
        <BottomSheet titre="Qui es-tu ?" onClose={() => monNom && setShowIdentite(false)}>
          <div className="pt-2 space-y-3">
            <p className="text-sm text-slate-500">Choisis ton nom — il sera mémorisé pour tes publications.</p>
            {AUTEURS.map(a => {
              const av = AUTEUR_AVATAR[a]
              return (
                <button key={a} onClick={() => { setAuteurLocal(a); setMonNom(a); setShowIdentite(false) }}
                  className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all active:scale-95 ${monNom === a ? 'border-sky-600 bg-sky-50' : 'border-slate-100 bg-white hover:border-slate-200'}`}>
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-black text-xl ${av.bg}`}>
                    {av.initiale}
                  </div>
                  <span className="text-lg font-bold text-slate-900">{a}</span>
                  {monNom === a && <span className="ml-auto text-sky-600 font-bold">✓</span>}
                </button>
              )
            })}
          </div>
        </BottomSheet>
      )}

      {/* ── Sheet Publier ── */}
      {showPublish && monNom && (
        <PublishSheet
          auteur={monNom}
          onClose={() => setShowPublish(false)}
          onPublished={(post) => {
            setPosts(prev => [post, ...prev])
            setShowPublish(false)
          }}
        />
      )}

      {/* ── Photo viewer plein écran ── */}
      {viewer && (
        <div className="fixed inset-0 z-[100] bg-black flex items-center justify-center"
          onClick={() => setViewer(null)}>
          <button className="absolute top-4 right-4 text-white/60 hover:text-white z-10 p-2">
            <X size={28} />
          </button>
          <img
            src={viewer.urls[viewer.idx]}
            alt=""
            className="max-w-full max-h-full object-contain"
            onClick={e => e.stopPropagation()}
          />
          {viewer.urls.length > 1 && (
            <div className="absolute bottom-6 inset-x-0 flex justify-center gap-2">
              {viewer.urls.map((_, i) => (
                <button key={i}
                  onClick={e => { e.stopPropagation(); setViewer(v => v ? { ...v, idx: i } : null) }}
                  className={`w-2 h-2 rounded-full transition-all ${i === viewer.idx ? 'bg-white' : 'bg-white/40'}`}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────
// PostCard — carte d'un souvenir
// ─────────────────────────────────────────────────────────

interface PostCardProps {
  post: JournalPost
  monNom: Auteur | null
  commentsOpen: boolean
  onToggleComments: () => void
  onLike: () => void
  onDelete: () => void
  onPhotoClick: (idx: number) => void
  onCommentAdded: (c: JournalPost['comments'][0]) => void
  onCommentDeleted: (id: string) => void
}

function PostCard({
  post, monNom, commentsOpen, onToggleComments,
  onLike, onDelete, onPhotoClick, onCommentAdded, onCommentDeleted,
}: PostCardProps) {
  const av = AUTEUR_AVATAR[post.auteur]
  const jaLike = monNom ? post.likes.some(l => l.auteur === monNom) : false
  const [texteExpanded, setTexteExpanded] = useState(false)
  const [newComment, setNewComment] = useState('')
  const [sending, setSending] = useState(false)
  const longTexte = (post.texte?.length ?? 0) > 140

  async function envoyerCommentaire() {
    if (!newComment.trim() || !monNom) return
    setSending(true)
    const res = await fetch('/api/journal/comments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ post_id: post.id, auteur: monNom, texte: newComment.trim() }),
    })
    if (res.ok) {
      const data = await res.json()
      onCommentAdded(data)
      setNewComment('')
    }
    setSending(false)
  }

  async function supprimerCommentaire(id: string) {
    const res = await fetch(`/api/journal/comments?id=${id}`, { method: 'DELETE' })
    if (res.ok) onCommentDeleted(id)
  }

  return (
    <div className="bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-sm">
      {/* ── Photos ── */}
      {post.photos.length > 0 && (
        <div className="relative">
          {post.photos.length === 1 ? (
            <img
              src={getPhotoUrl(post.photos[0].thumb_path ?? post.photos[0].storage_path)}
              alt=""
              className="w-full object-cover cursor-pointer"
              style={{ maxHeight: 380, minHeight: 200 }}
              onClick={() => onPhotoClick(0)}
              loading="lazy"
            />
          ) : (
            <div className="grid gap-0.5" style={{ gridTemplateColumns: post.photos.length === 2 ? '1fr 1fr' : '2fr 1fr' }}>
              {post.photos.slice(0, 3).map((ph, i) => (
                <div key={ph.id}
                  className={`relative overflow-hidden cursor-pointer ${i === 0 && post.photos.length > 2 ? 'row-span-2' : ''}`}
                  style={{ height: post.photos.length === 2 ? 220 : i === 0 ? 260 : 128 }}
                  onClick={() => onPhotoClick(i)}>
                  <img src={getPhotoUrl(ph.thumb_path ?? ph.storage_path)} alt=""
                    className="w-full h-full object-cover hover:scale-105 transition-transform" loading="lazy" />
                  {i === 2 && post.photos.length > 3 && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <span className="text-white text-xl font-black">+{post.photos.length - 3}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Corps du post ── */}
      <div className="px-4 pt-3 pb-0">
        {/* Auteur + métadonnées */}
        <div className="flex items-center gap-2.5 mb-2">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-black text-sm flex-shrink-0 ${av.bg}`}>
            {av.initiale}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-slate-900 text-sm">{post.auteur}</span>
              {post.meteo_emoji && post.meteo_temp != null && (
                <span className="text-xs text-slate-400">{post.meteo_emoji} {post.meteo_temp}°C</span>
              )}
              {post.lieu && (
                <span className="flex items-center gap-0.5 text-xs text-slate-400">
                  <MapPin size={10} />{post.lieu}
                </span>
              )}
            </div>
            <span className="text-xs text-slate-400">{formatHeure(post.created_at)}</span>
          </div>
          {/* Supprimer (auteur uniquement) */}
          {monNom === post.auteur && (
            <button onClick={onDelete} className="p-2 text-slate-300 hover:text-red-400 rounded-lg"><Trash2 size={14} /></button>
          )}
        </div>

        {/* Texte */}
        {post.texte && (
          <div className="mb-2">
            <p className={`text-sm text-slate-700 leading-relaxed ${!texteExpanded && longTexte ? 'line-clamp-3' : ''}`}>
              {post.texte}
            </p>
            {longTexte && (
              <button onClick={() => setTexteExpanded(e => !e)}
                className="text-xs text-sky-600 font-semibold mt-0.5 flex items-center gap-1">
                {texteExpanded ? <><ChevronUp size={12} /> Moins</> : <><ChevronDown size={12} /> Lire la suite</>}
              </button>
            )}
          </div>
        )}

        {/* Actions like + commentaires */}
        <div className="flex items-center gap-4 py-2 border-t border-slate-50 mt-1">
          <button onClick={onLike}
            className={`flex items-center gap-1.5 text-sm font-semibold transition-all active:scale-90 ${jaLike ? 'text-red-500' : 'text-slate-400 hover:text-red-400'}`}>
            <Heart size={18} fill={jaLike ? 'currentColor' : 'none'} />
            <span>{post.likes.length || ''}</span>
          </button>
          <button onClick={onToggleComments}
            className="flex items-center gap-1.5 text-sm font-semibold text-slate-400 hover:text-sky-500 transition-colors">
            <MessageCircle size={18} />
            <span>{post.comments.length || ''}</span>
          </button>
          {post.lat && post.lng && (
            <span className="ml-auto flex items-center gap-1 text-xs text-slate-300">
              <Navigation size={11} />
              {post.lat.toFixed(3)}, {post.lng.toFixed(3)}
            </span>
          )}
        </div>

        {/* Commentaires */}
        {commentsOpen && (
          <div className="border-t border-slate-50 pt-3 pb-3 space-y-3">
            {post.comments.map(c => {
              const cav = AUTEUR_AVATAR[c.auteur]
              return (
                <div key={c.id} className="flex gap-2 items-start">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white font-bold text-xs flex-shrink-0 ${cav.bg}`}>
                    {cav.initiale}
                  </div>
                  <div className="flex-1 bg-slate-50 rounded-2xl px-3 py-2">
                    <span className="font-bold text-xs text-slate-700">{c.auteur} </span>
                    <span className="text-sm text-slate-600">{c.texte}</span>
                  </div>
                  {monNom === c.auteur && (
                    <button onClick={() => supprimerCommentaire(c.id)}
                      className="p-1 text-slate-300 hover:text-red-400"><X size={12} /></button>
                  )}
                </div>
              )
            })}

            {/* Saisir un commentaire */}
            {monNom && (
              <div className="flex gap-2 items-center">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white font-bold text-xs flex-shrink-0 ${AUTEUR_AVATAR[monNom].bg}`}>
                  {AUTEUR_AVATAR[monNom].initiale}
                </div>
                <input
                  value={newComment}
                  onChange={e => setNewComment(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); envoyerCommentaire() }}}
                  placeholder="Un commentaire..."
                  className="flex-1 bg-slate-50 border border-slate-100 rounded-full px-4 py-2 text-sm outline-none"
                />
                <button onClick={envoyerCommentaire} disabled={!newComment.trim() || sending}
                  className="p-2 text-sky-600 disabled:text-slate-300"><Send size={16} /></button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────
// PublishSheet — formulaire de publication
// ─────────────────────────────────────────────────────────

interface PublishSheetProps {
  auteur: Auteur
  onClose: () => void
  onPublished: (post: JournalPost) => void
}

function PublishSheet({ auteur, onClose, onPublished }: PublishSheetProps) {
  const [texte, setTexte] = useState('')
  const [ile, setIle] = useState<string>('')
  const [lieu, setLieu] = useState('')
  const [dateVoyage, setDateVoyage] = useState(() => new Date().toISOString().split('T')[0])
  const [photos, setPhotos] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])
  const [geoStatus, setGeoStatus] = useState<'idle' | 'loading' | 'ok' | 'error'>('idle')
  const [geoPos, setGeoPos] = useState<{ lat: number; lng: number } | null>(null)
  const [meteo, setMeteo] = useState<{ temp: number; code: number; emoji: string } | null>(null)
  const [publishing, setPublishing] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  // Auto-géolocalisation au chargement
  useEffect(() => {
    demanderGeo()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function demanderGeo() {
    setGeoStatus('loading')
    try {
      const pos = await getCurrentPosition()
      setGeoPos(pos)
      setGeoStatus('ok')
      // Météo avec les vraies coordonnées
      const m = await fetchMeteo(pos.lat, pos.lng)
      if (m) setMeteo({ temp: m.temp, code: m.code, emoji: m.emoji })
    } catch {
      setGeoStatus('error')
      // Météo avec coordonnées de l'île sélectionnée
      if (ile && ILE_COORDS[ile]) {
        const m = await fetchMeteo(ILE_COORDS[ile].lat, ILE_COORDS[ile].lng)
        if (m) setMeteo({ temp: m.temp, code: m.code, emoji: m.emoji })
      }
    }
  }

  // Quand l'île change et qu'on n'a pas de géoloc, charger la météo de l'île
  useEffect(() => {
    if (geoStatus !== 'ok' && ile && ILE_COORDS[ile]) {
      fetchMeteo(ILE_COORDS[ile].lat, ILE_COORDS[ile].lng).then(m => {
        if (m) setMeteo({ temp: m.temp, code: m.code, emoji: m.emoji })
      })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ile])

  function ajouterPhotos(files: FileList | null) {
    if (!files) return
    const newFiles = Array.from(files).slice(0, 10 - photos.length)
    setPhotos(prev => [...prev, ...newFiles])
    newFiles.forEach(f => {
      const url = URL.createObjectURL(f)
      setPreviews(prev => [...prev, url])
    })
  }

  function retirerPhoto(idx: number) {
    URL.revokeObjectURL(previews[idx])
    setPhotos(prev => prev.filter((_, i) => i !== idx))
    setPreviews(prev => prev.filter((_, i) => i !== idx))
  }

  async function publier() {
    if (!texte.trim() && photos.length === 0) return
    setPublishing(true)

    try {
      // 1. Uploader et compresser les photos
      const photosMeta: { storage_path: string; thumb_path: string; width: number; height: number; taille_ko: number }[] = []
      const dateStr = dateVoyage.replace(/-/g, '')
      const uuid = () => Math.random().toString(36).slice(2, 10)

      for (const file of photos) {
        const id = uuid()
        // Original compressé : max 1920px, qualité 0.82
        const { blob: origBlob, width, height } = await compressImage(file, 1920, 0.82)
        // Miniature : max 800px, qualité 0.75
        const { blob: thumbBlob } = await compressImage(file, 800, 0.75)

        const origPath = `${auteur}/${dateStr}/${id}.webp`
        const thumbPath = `${auteur}/${dateStr}/thumb_${id}.webp`

        const [origUp, thumbUp] = await Promise.all([
          supabase.storage.from('journal').upload(origPath, origBlob, { contentType: 'image/webp', upsert: false }),
          supabase.storage.from('journal').upload(thumbPath, thumbBlob, { contentType: 'image/webp', upsert: false }),
        ])

        if (origUp.error) throw origUp.error

        photosMeta.push({
          storage_path: origPath,
          thumb_path: thumbUp.error ? origPath : thumbPath,
          width, height,
          taille_ko: Math.round(origBlob.size / 1024),
        })
      }

      // 2. Créer le post via API
      const payload = {
        auteur,
        texte: texte.trim() || null,
        date_voyage: dateVoyage,
        ile: ile || null,
        lieu: lieu.trim() || null,
        lat: geoPos?.lat ?? null,
        lng: geoPos?.lng ?? null,
        meteo_temp: meteo?.temp ?? null,
        meteo_code: meteo?.code ?? null,
        meteo_emoji: meteo?.emoji ?? null,
        photos: photosMeta,
      }

      const res = await fetch('/api/journal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) throw new Error('Erreur publication')
      const post = await res.json()

      // Construire le post complet pour mise à jour optimiste
      onPublished({
        ...post,
        photos: photosMeta.map((p, i) => ({ id: i.toString(), post_id: post.id, sort_order: i, ...p })),
        comments: [],
        likes: [],
      })
    } catch (err) {
      console.error(err)
      alert('Erreur lors de la publication. Réessaie.')
    } finally {
      setPublishing(false)
    }
  }

  return (
    <BottomSheet titre="Nouveau souvenir" onClose={onClose}>
      <div className="space-y-4 pt-2">

        {/* Auteur + météo actuelle */}
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-black ${AUTEUR_AVATAR[auteur].bg}`}>
            {AUTEUR_AVATAR[auteur].initiale}
          </div>
          <div>
            <p className="font-bold text-slate-900">{auteur}</p>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              {geoStatus === 'loading' && <span>📡 Localisation...</span>}
              {geoStatus === 'ok' && <span className="text-emerald-600">📍 Position obtenue</span>}
              {geoStatus === 'error' && (
                <button onClick={demanderGeo} className="text-sky-600 font-semibold">
                  📍 Activer la géoloc
                </button>
              )}
              {meteo && <span>{meteo.emoji} {meteo.temp}°C</span>}
            </div>
          </div>
        </div>

        {/* Photos */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">Photos</label>
          <div className="flex gap-2 flex-wrap">
            {previews.map((url, i) => (
              <div key={i} className="relative w-20 h-20 rounded-xl overflow-hidden flex-shrink-0">
                <img src={url} alt="" className="w-full h-full object-cover" />
                <button onClick={() => retirerPhoto(i)}
                  className="absolute top-0.5 right-0.5 w-5 h-5 bg-black/60 rounded-full flex items-center justify-center text-white">
                  <X size={10} />
                </button>
              </div>
            ))}
            {photos.length < 10 && (
              <button onClick={() => fileRef.current?.click()}
                className="w-20 h-20 rounded-xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400 hover:border-sky-400 hover:text-sky-500 transition-colors flex-shrink-0">
                <ImagePlus size={20} />
                <span className="text-[10px] mt-1 font-semibold">Ajouter</span>
              </button>
            )}
          </div>
          <input ref={fileRef} type="file" accept="image/*" multiple className="hidden"
            onChange={e => ajouterPhotos(e.target.files)} />
          {photos.length > 0 && (
            <p className="text-xs text-slate-400 mt-1">
              {photos.length} photo{photos.length > 1 ? 's' : ''} — compression auto avant envoi
            </p>
          )}
        </div>

        {/* Texte */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">Texte</label>
          <textarea
            value={texte}
            onChange={e => setTexte(e.target.value)}
            placeholder="Qu'est-ce que tu retiens de ce moment..."
            rows={3}
            className="w-full border border-slate-200 rounded-2xl px-4 py-3 text-sm resize-none outline-none text-slate-800 placeholder-slate-400"
          />
        </div>

        {/* Île + Date + Lieu */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Île</label>
            <select value={ile} onChange={e => setIle(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm">
              <option value="">— Sélectionner —</option>
              {ILES.map(i => <option key={i.slug} value={i.slug}>{i.emoji} {i.nom}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Date</label>
            <input type="date" value={dateVoyage} onChange={e => setDateVoyage(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm" />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1.5">Lieu précis (optionnel)</label>
          <input value={lieu} onChange={e => setLieu(e.target.value)}
            placeholder="ex: Plage de Matira, Motu Tapu..."
            className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm" />
        </div>

        {/* Bouton publier */}
        <button onClick={publier}
          disabled={publishing || (!texte.trim() && photos.length === 0)}
          className="w-full py-4 bg-sky-600 text-white rounded-2xl font-black text-base hover:bg-sky-700 disabled:opacity-40 transition-all active:scale-[.98]">
          {publishing ? '⏳ Publication...' : '✨ Publier ce souvenir'}
        </button>

        {publishing && (
          <p className="text-xs text-slate-400 text-center">
            Compression et upload en cours...
          </p>
        )}
      </div>
    </BottomSheet>
  )
}
