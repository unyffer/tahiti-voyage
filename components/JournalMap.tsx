'use client'

import { useEffect, useRef } from 'react'
import type { JournalPost, JournalTrack } from '@/lib/journal'
import { getPhotoUrl, AUTEUR_AVATAR } from '@/lib/journal'

interface JournalMapProps {
  posts: JournalPost[]
  tracks: JournalTrack[]
  onPostClick?: (post: JournalPost) => void
}

export default function JournalMap({ posts, tracks, onPostClick }: JournalMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapInstance = useRef<any>(null)

  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return

    // Import dynamique de Leaflet (client-side uniquement)
    import('leaflet').then((L) => {
      // Fix icônes Leaflet avec webpack
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (L.Icon.Default.prototype as any)._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      })

      // Centrer sur la Polynésie française
      const map = L.map(mapRef.current!, {
        center: [-16.5, -151.5],
        zoom: 7,
        zoomControl: true,
      })
      mapInstance.current = map

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap',
        maxZoom: 18,
      }).addTo(map)

      // ── Tracé des déplacements (polyline) ──
      const trackPoints = tracks.map(t => [t.lat, t.lng] as [number, number])
      if (trackPoints.length > 1) {
        L.polyline(trackPoints, {
          color: '#0284c7',
          weight: 2.5,
          opacity: 0.7,
          dashArray: '6, 6',
        }).addTo(map)
      }

      // ── Marqueurs des posts avec photo/texte ──
      posts.forEach((post) => {
        if (!post.lat || !post.lng) return

        const avatar = AUTEUR_AVATAR[post.auteur]
        const thumb = post.photos[0]?.thumb_path
          ? getPhotoUrl(post.photos[0].thumb_path)
          : null

        const iconHtml = thumb
          ? `<div style="
              width:44px;height:44px;border-radius:50%;overflow:hidden;
              border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.25);">
              <img src="${thumb}" style="width:100%;height:100%;object-fit:cover;" />
            </div>`
          : `<div style="
              width:40px;height:40px;border-radius:50%;
              display:flex;align-items:center;justify-content:center;
              font-size:18px;font-weight:900;color:white;
              border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.25);"
              class="${avatar.bg}">
              ${avatar.initiale}
            </div>`

        const icon = L.divIcon({
          html: iconHtml,
          className: '',
          iconSize: [44, 44],
          iconAnchor: [22, 22],
        })

        const marker = L.marker([post.lat, post.lng], { icon }).addTo(map)

        const popupHtml = `
          <div style="min-width:160px;font-family:sans-serif;">
            ${thumb ? `<img src="${thumb}" style="width:100%;height:100px;object-fit:cover;border-radius:8px;margin-bottom:6px;" />` : ''}
            <div style="font-size:11px;color:#64748b;margin-bottom:2px;">
              ${post.auteur} · ${post.meteo_emoji ?? ''} ${post.meteo_temp != null ? post.meteo_temp + '°C' : ''}
            </div>
            ${post.lieu ? `<div style="font-size:12px;font-weight:600;color:#0f172a;">${post.lieu}</div>` : ''}
            ${post.texte ? `<div style="font-size:12px;color:#475569;margin-top:3px;">${post.texte.slice(0, 80)}${post.texte.length > 80 ? '…' : ''}</div>` : ''}
          </div>
        `
        marker.bindPopup(popupHtml, { maxWidth: 200 })

        if (onPostClick) {
          marker.on('click', () => onPostClick(post))
        }
      })

      // ── Points de tracé discrets ──
      tracks.forEach((t) => {
        const dot = L.circleMarker([t.lat, t.lng], {
          radius: 4,
          fillColor: '#0284c7',
          fillOpacity: 0.6,
          color: 'white',
          weight: 1.5,
        }).addTo(map)
        if (t.note) {
          dot.bindTooltip(t.note, { permanent: false })
        }
      })

      // Ajuster le zoom si on a des points
      const allPoints: [number, number][] = [
        ...posts.filter(p => p.lat && p.lng).map(p => [p.lat!, p.lng!] as [number, number]),
        ...tracks.map(t => [t.lat, t.lng] as [number, number]),
      ]
      if (allPoints.length > 0) {
        map.fitBounds(L.latLngBounds(allPoints), { padding: [30, 30], maxZoom: 12 })
      }
    })

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove()
        mapInstance.current = null
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <>
      <link
        rel="stylesheet"
        href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
      />
      <div ref={mapRef} style={{ width: '100%', height: '100%' }} />
    </>
  )
}
