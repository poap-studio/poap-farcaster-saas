import { ImageResponse } from '@vercel/og'
 
export const runtime = 'edge'
 
export const alt = 'Social POAPs - Drop POAPs on Farcaster'
export const size = {
  width: 1200,
  height: 630,
}
 
export const contentType = 'image/png'
 
export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(to bottom right, #1e293b, #0f172a)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
        }}
      >
        {/* Background pattern */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(139, 92, 246, 0.3) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(59, 130, 246, 0.3) 0%, transparent 50%)',
          }}
        />
        
        {/* Content */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            zIndex: 10,
          }}
        >
          {/* Gift emoji */}
          <div
            style={{
              fontSize: '120px',
              marginBottom: '40px',
            }}
          >
            🎁
          </div>
          
          {/* Title */}
          <h1
            style={{
              fontSize: '72px',
              fontWeight: 'bold',
              background: 'linear-gradient(to right, #a855f7, #3b82f6)',
              backgroundClip: 'text',
              color: 'transparent',
              margin: 0,
              marginBottom: '20px',
              textAlign: 'center',
            }}
          >
            Social POAPs
          </h1>
          
          {/* Subtitle */}
          <p
            style={{
              fontSize: '32px',
              color: '#e2e8f0',
              margin: 0,
              marginBottom: '40px',
              textAlign: 'center',
            }}
          >
            Drop POAPs on Farcaster
          </p>
          
          {/* Description */}
          <p
            style={{
              fontSize: '24px',
              color: '#94a3b8',
              margin: 0,
              textAlign: 'center',
              maxWidth: '800px',
              lineHeight: 1.4,
            }}
          >
            Turn social engagement into Web3 connections with gas-free collectibles
          </p>
        </div>
        
        {/* Bottom branding */}
        <div
          style={{
            position: 'absolute',
            bottom: '40px',
            right: '40px',
            fontSize: '20px',
            color: '#64748b',
          }}
        >
          poap.studio
        </div>
      </div>
    ),
    {
      ...size,
    }
  )
}