import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Nav from '@/components/Nav'
import { RoleProvider } from '@/components/RoleContext'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Voyage Tahiti 2026',
  description: 'Planification du voyage à Tahiti — Régis, Isa, Agathe',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr">
      <body className={`${inter.className} bg-gray-50 min-h-screen`}>
        <RoleProvider>
          <Nav />
          <main className="max-w-6xl mx-auto px-4 py-6">{children}</main>
        </RoleProvider>
      </body>
    </html>
  )
}
