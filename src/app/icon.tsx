import { ImageResponse } from 'next/og'

export const size = { width: 32, height: 32 }
export const contentType = 'image/png'

export default function Icon() {
  return new ImageResponse(
    <div
      style={{
        background: '#ffe600',
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: '6px',
      }}
    >
      <div
        style={{
          color: '#000',
          fontSize: 14,
          fontWeight: 800,
          fontFamily: 'sans-serif',
          letterSpacing: '-0.5px',
        }}
      >
        BBX
      </div>
    </div>,
    { ...size }
  )
}
