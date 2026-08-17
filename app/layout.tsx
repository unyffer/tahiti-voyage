import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import BottomNav from '@/components/BottomNav'
import DesktopSidebar from '@/components/DesktopSidebar'
import { RoleProvider } from '@/components/RoleContext'
import Toast from '@/components/Toast'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Tahiti 2026',
  description: 'Notre voyage en Polynésie française — Régis, Isa, Agathe',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Tahiti 2026',
  },
  other: {
    'mobile-web-app-capable': 'yes',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#0284C7',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <head>
        <link rel="apple-touch-icon" href="/icon.svg" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body className={`${inter.className} bg-slate-50 lg:bg-white min-h-screen`}>
        <RoleProvider>
          {/* Sidebar desktop (lg+) */}
          <DesktopSidebar />

          {/* Zone de contenu : marges adaptées mobile / desktop */}
          <div className="lg:ml-60">
            <main className="max-w-2xl mx-auto pb-24 min-h-screen lg:max-w-4xl lg:pb-12 lg:px-8">
              {children}
            </main>
          </div>

          {/* Navigation mobile (lg:hidden géré dans le composant) */}
          <BottomNav />
          <Toast />
        </RoleProvider>

        {/* Service Worker registration */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', () => {
                  navigator.serviceWorker.register('/sw.js').catch(() => {});
                });
              }
            `,
          }}
        />
      </body>
    </html>
  )
}
