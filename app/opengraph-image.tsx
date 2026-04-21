import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'Easy Travel — Réservez votre billet de bus au Cameroun'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image() {
  const appName = process.env.NEXT_PUBLIC_APP_NAME || 'Easy Travel'
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '72px',
          background: 'linear-gradient(135deg, #0a1a10 0%, #0f2a1a 55%, #13ec5b 150%)',
          color: 'white',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 16,
              background: '#13ec5b',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#0a1a10',
              fontSize: 32,
              fontWeight: 800,
            }}
          >
            E
          </div>
          <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: -0.5 }}>
            {appName}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div style={{ fontSize: 72, fontWeight: 800, lineHeight: 1.05, letterSpacing: -2, maxWidth: 900 }}>
            Réservez votre billet de bus au Cameroun.
          </div>
          <div style={{ fontSize: 28, color: '#bfe9cd', maxWidth: 900, lineHeight: 1.3 }}>
            Comparez toutes les compagnies, choisissez votre siège, payez par Mobile Money. Billet QR instantané.
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: 22,
            color: '#8fd2a5',
          }}
        >
          <div style={{ display: 'flex', gap: 28 }}>
            <span>Yaoundé</span>
            <span style={{ color: '#13ec5b' }}>→</span>
            <span>Douala</span>
            <span style={{ color: '#13ec5b' }}>→</span>
            <span>Bafoussam</span>
          </div>
          <div style={{ fontWeight: 700, color: '#13ec5b' }}>easytravel.cm</div>
        </div>
      </div>
    ),
    { ...size },
  )
}
