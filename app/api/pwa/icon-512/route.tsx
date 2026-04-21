import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export async function GET() {
  return new ImageResponse(<IconMark />, { width: 512, height: 512 })
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
        fontSize: 300,
        fontWeight: 900,
        letterSpacing: -10,
        fontFamily: 'sans-serif',
      }}
    >
      E
    </div>
  )
}
