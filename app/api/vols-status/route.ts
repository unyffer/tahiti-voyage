export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'

export interface VolStatusResponse {
  vol: string
  date: string
  statut: 'Scheduled' | 'EnRoute' | 'Landed' | 'Cancelled' | 'Diverted' | 'Unknown'
  retard: number | null        // minutes
  departPrévu: string | null   // HH:MM local
  departRéel: string | null    // HH:MM local (si différent)
  arriveePrévue: string | null
  arriveeRéelle: string | null
  source: 'live' | 'unavailable'
  fetchedAt: string            // ISO timestamp
}

function extractHHMM(localTime: string | undefined | null): string | null {
  if (!localTime) return null
  // Format: "2026-09-14T10:50:00+10:00" → "10:50"
  const match = localTime.match(/T(\d{2}:\d{2})/)
  return match ? match[1] : null
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const vol = searchParams.get('vol')
  const date = searchParams.get('date') // YYYY-MM-DD

  if (!vol || !date) {
    return NextResponse.json({ error: 'Paramètres vol et date requis' }, { status: 400 })
  }

  const apiKey = process.env.AERODATABOX_API_KEY
  if (!apiKey || apiKey === 'votre_cle_rapidapi') {
    return NextResponse.json<VolStatusResponse>({
      vol, date, statut: 'Unknown', retard: null,
      departPrévu: null, departRéel: null,
      arriveePrévue: null, arriveeRéelle: null,
      source: 'unavailable',
      fetchedAt: new Date().toISOString(),
    })
  }

  try {
    const url = `https://aerodatabox.p.rapidapi.com/flights/number/${encodeURIComponent(vol)}/${date}`
    const res = await fetch(url, {
      headers: {
        'x-rapidapi-host': 'aerodatabox.p.rapidapi.com',
        'x-rapidapi-key': apiKey,
      },
    })

    if (!res.ok) {
      const body = await res.text()
      console.error(`AeroDataBox ${res.status} for ${vol}/${date}:`, body)
      return NextResponse.json<VolStatusResponse>({
        vol, date, statut: 'Unknown', retard: null,
        departPrévu: null, departRéel: null,
        arriveePrévue: null, arriveeRéelle: null,
        source: 'unavailable',
        fetchedAt: new Date().toISOString(),
      })
    }

    const data = await res.json()
    // AeroDataBox returns an array of matching flights
    const flight = Array.isArray(data) ? data[0] : data

    if (!flight) {
      return NextResponse.json<VolStatusResponse>({
        vol, date, statut: 'Unknown', retard: null,
        departPrévu: null, departRéel: null,
        arriveePrévue: null, arriveeRéelle: null,
        source: 'unavailable',
        fetchedAt: new Date().toISOString(),
      })
    }

    const result: VolStatusResponse = {
      vol,
      date,
      statut: flight.status ?? 'Unknown',
      retard: flight.departure?.delay ?? null,
      departPrévu: extractHHMM(flight.departure?.scheduledTime?.local),
      departRéel: extractHHMM(flight.departure?.actualTime?.local),
      arriveePrévue: extractHHMM(flight.arrival?.scheduledTime?.local),
      arriveeRéelle: extractHHMM(flight.arrival?.actualTime?.local),
      source: 'live',
      fetchedAt: new Date().toISOString(),
    }

    return NextResponse.json<VolStatusResponse>(result, {
      headers: {
        // Allow CDN/browser to cache 5 minutes
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60',
      },
    })
  } catch (err) {
    console.error('Erreur AeroDataBox:', err)
    return NextResponse.json<VolStatusResponse>({
      vol, date, statut: 'Unknown', retard: null,
      departPrévu: null, departRéel: null,
      arriveePrévue: null, arriveeRéelle: null,
      source: 'unavailable',
      fetchedAt: new Date().toISOString(),
    })
  }
}
