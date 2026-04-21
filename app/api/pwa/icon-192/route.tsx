import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export async function GET() {
  return new ImageResponse(<IconMark />, { width: 192, height: 192 })
}

function IconMark() {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #13ec5b 0%, #0aa83f 100%)',
        color: '#0a1a10',
        fontSize: 110,
        fontWeight: 900,
        letterSpacing: -4,
        fontFamily: 'sans-serif',
      }}
    >
      E
    </div>
  )
}
