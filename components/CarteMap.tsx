'use client'

import { useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Fix des icônes Leaflet avec Next.js
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
})

const ILES_CARTE = [
  {
    nom: 'Tahiti (aller)',
    slug: 'tahiti',
    emoji: '🌺',
    coords: [-17.6509, -149.4260] as [number, number],
    dates: '4-7 sept.',
    nuits: 3,
    couleur: '#0d9488',
    ordre: 1,
  },
  {
    nom: 'Moorea',
    slug: 'moorea',
    emoji: '🐋',
    coords: [-17.5333, -149.8333] as [number, number],
    dates: '7-14 sept.',
    nuits: 7,
    couleur: '#0891b2',
    ordre: 2,
  },
  {
    nom: "Taha'a",
    slug: 'tahaa',
    emoji: '🌸',
    coords: [-16.6200, -151.5000] as [number, number],
    dates: '14-19 sept.',
    nuits: 5,
    couleur: '#ec4899',
    ordre: 3,
  },
  {
    nom: 'Maupiti',
    slug: 'maupiti',
    emoji: '🤿',
    coords: [-16.4500, -152.2500] as [number, number],
    dates: '19-22 sept.',
    nuits: 3,
    couleur: '#3b82f6',
    ordre: 4,
  },
  {
    nom: 'Bora Bora',
    slug: 'bora-bora',
    emoji: '🏝️',
    coords: [-16.5004, -151.7415] as [number, number],
    dates: '22-29 sept.',
    nuits: 7,
    couleur: '#06b6d4',
    ordre: 5,
  },
  {
    nom: 'Tahiti (retour)',
    slug: 'tahiti',
    emoji: '🌺',
    coords: [-17.6809, -149.5260] as [number, number], // Légèrement décalé pour visibilité
    dates: '29 sept.-2 oct.',
    nuits: 3,
    couleur: '#0d9488',
    ordre: 6,
  },
]

function createIcon(emoji: string, couleur: string) {
  return L.divIcon({
    html: `
      <div style="
        background: ${couleur};
        border: 3px solid white;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        width: 36px; height: 36px;
        display: flex; align-items: center; justify-content: center;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      ">
        <span style="transform: rotate(45deg); font-size: 16px; line-height: 1;">${emoji}</span>
      </div>
    `,
    className: '',
    iconSize: [36, 36],
    iconAnchor: [18, 36],
    popupAnchor: [0, -36],
  })
}

function FitBounds() {
  const map = useMap()
  useEffect(() => {
    const bounds = L.latLngBounds(ILES_CARTE.map(i => i.coords))
    map.fitBounds(bounds, { padding: [40, 40] })
  }, [map])
  return null
}

export default function CarteMap() {
  const route = ILES_CARTE.map(i => i.coords)

  return (
    <MapContainer
      center={[-17.0, -150.8]}
      zoom={8}
      style={{ height: '100%', width: '100%', borderRadius: '0.75rem' }}
      scrollWheelZoom={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <FitBounds />

      {/* Ligne de l'itinéraire */}
      <Polyline
        positions={route}
        pathOptions={{ color: '#0d9488', weight: 3, opacity: 0.7, dashArray: '8, 6' }}
      />

      {/* Marqueurs */}
      {ILES_CARTE.map((ile, i) => (
        <Marker key={i} position={ile.coords} icon={createIcon(ile.emoji, ile.couleur)}>
          <Popup>
            <div className="text-center min-w-[140px]">
              <div className="text-2xl mb-1">{ile.emoji}</div>
              <div className="font-bold text-gray-800 text-base">{ile.nom}</div>
              <div className="text-teal-600 font-medium text-sm mt-1">{ile.dates}</div>
              <div className="text-gray-500 text-xs mt-0.5">{ile.nuits} nuit{ile.nuits > 1 ? 's' : ''}</div>
              <div className="mt-2 bg-gray-100 rounded px-2 py-1 text-xs text-gray-600 font-semibold">
                Étape {ile.ordre} / 6
              </div>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  )
}
