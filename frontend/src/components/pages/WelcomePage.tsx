import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'

// Safe zones: left edge (0–18%) and right edge (82–100%) only
// Center zone (18%–82%) is completely clear — no products
// Products strictly in 4 corners, no center drift
const PRODUCTS = [
  // TOP-LEFT — 2 products, stacked
  { src: '/src/assets/extrajoss.png',   top: '5%',  left: '1%',  rot:  3, delay: '0.0s', spd: 9  },
  { src: '/src/assets/komix.png',       top: '22%', left: '6%',  rot: -5, delay: '0.5s', spd: 7  },
  // MID-LEFT — 1 product
  { src: '/src/assets/femmy.png',       top: '55%', left: '2%',  rot:  4, delay: '0.9s', spd: 6  },
  // BOTTOM-LEFT — 1 product
  { src: '/src/assets/puyer.png',       top: '75%', left: '3%',  rot: -3, delay: '1.3s', spd: 8  },

  // TOP-RIGHT — 2 products, stacked
  { src: '/src/assets/bejo.png',        top: '4%',  left: '83%', rot:  5, delay: '0.2s', spd: 9  },
  { src: '/src/assets/ejsport.png',     top: '20%', left: '87%', rot: -4, delay: '0.7s', spd: 7  },
  // MID-RIGHT — 1 product
  { src: '/src/assets/slasi.png',       top: '55%', left: '86%', rot: -3, delay: '1.1s', spd: 6  },
  // BOTTOM-RIGHT — 2 products
  { src: '/src/assets/komixherbal.png', top: '72%', left: '83%', rot: -5, delay: '1.5s', spd: 8  },
  { src: '/src/assets/waisan.png',      top: '82%', left: '88%', rot:  3, delay: '1.9s', spd: 5  },
]

const SIZE = 88 // px — all identical

function toTitleCase(s: string) {
  return s.toLowerCase().split(' ').map(w => w[0].toUpperCase() + w.slice(1)).join(' ')
}

function getDate() {
  return new Date().toLocaleDateString('id-ID', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })
}

export default function WelcomePage() {
  const { user } = useAuth()
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  const h = new Date().getHours()
  const greeting =
    h < 5  ? 'Selamat Malam' :
    h < 12 ? 'Selamat Pagi'  :
    h < 17 ? 'Selamat Siang' :
             'Selamat Sore'

  const name = user?.full_name ? toTitleCase(user.full_name) : ''

  const bg = isDark
    ? '#0f1410'
    : 'radial-gradient(ellipse 200% 170% at 50% 115%, #bcd8bc 0%, #d4ecd4 18%, #e8f3e8 36%, #f4f8f4 58%, #fafcfa 100%)'

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700;9..40,800&display=swap');

        @keyframes pageIn { from{opacity:0} to{opacity:1} }
        @keyframes up { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
        @keyframes flt {
          0%,100% { transform: translateY(0) rotate(var(--r)); }
          50%      { transform: translateY(-10px) rotate(calc(var(--r) + 1.5deg)); }
        }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.3} }

        .pg  { animation: pageIn 0.45s ease both; }
        .u1  { animation: up 0.6s cubic-bezier(0.16,1,0.3,1) 0.08s both; }
        .u2  { animation: up 0.6s cubic-bezier(0.16,1,0.3,1) 0.18s both; }
        .u3  { animation: up 0.6s cubic-bezier(0.16,1,0.3,1) 0.28s both; }
        .u4  { animation: up 0.6s cubic-bezier(0.16,1,0.3,1) 0.38s both; }
        .u5  { animation: up 0.6s cubic-bezier(0.16,1,0.3,1) 0.46s both; }
        .dot { animation: blink 2.4s ease-in-out infinite; }
      `}</style>

      {/* ── Root ──────────────────────────────────────────────── */}
      <div className="pg" style={{
        minHeight: '100%',
        position: 'relative',
        overflow: 'hidden',
        fontFamily: "'DM Sans', sans-serif",
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: bg,
      }}>

        {/* Subtle grain */}
        <svg style={{ position:'absolute', inset:0, width:'100%', height:'100%', pointerEvents:'none', zIndex:0, opacity: isDark ? 0.5 : 0.35 }}>
          <filter id="gr">
            <feTurbulence type="fractalNoise" baseFrequency="0.72" numOctaves="4" stitchTiles="stitch"/>
            <feColorMatrix type="saturate" values="0"/>
          </filter>
          <rect width="100%" height="100%" filter="url(#gr)" opacity="0.04"/>
        </svg>

        {/* Soft center light */}
        <div style={{
          position:'absolute', inset:0, zIndex:1, pointerEvents:'none',
          background: isDark
            ? 'radial-gradient(ellipse 50% 45% at 50% 45%, rgba(45,106,79,0.08) 0%, transparent 100%)'
            : 'radial-gradient(ellipse 50% 45% at 50% 45%, rgba(255,255,255,0.65) 0%, transparent 100%)',
        }}/>

        {/* ── Floating products — LEFT EDGE ONLY ───────────────── */}
        {PRODUCTS.map((p, i) => (
          <div key={i} style={{
            position: 'absolute',
            top: p.top,
            left: p.left,
            width: SIZE, height: SIZE,
            zIndex: 2,
            pointerEvents: 'none',
            animationDelay: p.delay,
            ['--r' as string]: `${p.rot}deg`,
            animation: `flt ${p.spd}s ease-in-out infinite ${p.delay}`,
          }}>
            <img src={p.src} alt="" aria-hidden style={{
              width: '100%', height: '100%',
              objectFit: 'contain',
              opacity: isDark ? 0.18 : 0.45,
              filter: 'drop-shadow(0 6px 14px rgba(30,80,50,0.10))',
            }}/>
          </div>
        ))}

        {/* ── HERO CENTER — z:20, narrow, purely text flow ──────── */}
        <div style={{
          position: 'relative',
          zIndex: 20,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          width: '100%',
          maxWidth: '440px',
          padding: '0 20px',
          /* Push content slightly above center */
          marginTop: '-40px',
        }}>

          {/* Date + Online badge */}
          <div className="u1" style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            flexWrap: 'wrap', justifyContent: 'center',
            marginBottom: '24px',
          }}>
            <span style={{ fontSize:'12px', color: isDark ? '#5a7060' : '#8aaa8e', fontWeight:400, whiteSpace:'nowrap' }}>
              {getDate()}
            </span>
            <span style={{ width:'3px', height:'3px', borderRadius:'50%', background: isDark ? '#3a5040' : '#b0c8b2', flexShrink:0 }}/>
            <span style={{
              display:'inline-flex', alignItems:'center', gap:'5px',
              fontSize:'11px', fontWeight:700, letterSpacing:'0.09em', textTransform:'uppercase',
              color: isDark ? '#52c984' : '#1e5c34',
              background: isDark ? 'rgba(52,150,90,0.18)' : 'rgba(30,92,52,0.08)',
              border: `1px solid ${isDark ? 'rgba(52,150,90,0.35)' : 'rgba(30,92,52,0.18)'}`,
              borderRadius:'999px', padding:'3px 10px', whiteSpace:'nowrap',
            }}>
              <span className="dot" style={{ display:'inline-block', width:'6px', height:'6px', borderRadius:'50%', background:'#34c265' }}/>
              Online
            </span>
          </div>

          {/* Eyebrow */}
          <p className="u2" style={{
            fontSize:'11px', fontWeight:700, letterSpacing:'0.18em',
            textTransform:'uppercase',
            color: isDark ? '#52c984' : '#1e5c34',
            marginBottom:'12px', opacity:0.8,
          }}>
            {greeting}
          </p>

          {/* "Selamat datang," */}
          <p className="u3" style={{
            fontSize:'2rem', fontWeight:700, lineHeight:1.25,
            letterSpacing:'-0.018em',
            color: isDark ? '#ccdacc' : '#162a18',
            marginBottom:'4px',
          }}>
            Selamat datang,
          </p>

          {/* Name — same size, green */}
          <p className="u3" style={{
            fontSize:'2rem', fontWeight:800, lineHeight:1.25,
            letterSpacing:'-0.018em',
            color: isDark ? '#52c984' : '#1e5c34',
            marginBottom:'20px',
            wordBreak:'break-word',
          }}>
            {name}
          </p>

          {/* Divider */}
          <div className="u4" style={{
            width:'28px', height:'1.5px', borderRadius:'2px',
            background: isDark
              ? 'linear-gradient(90deg, transparent, #52c984, transparent)'
              : 'linear-gradient(90deg, transparent, #1e5c34, transparent)',
            marginBottom:'18px', opacity:0.5,
          }}/>

          {/* Body */}
          <p className="u4" style={{
            fontSize:'14px', fontWeight:400, lineHeight:1.85,
            color: isDark ? '#5a7860' : '#3d5c42',
            marginBottom:'6px',
          }}>
            Aplikasi internal{' '}
            <span style={{ color: isDark ? '#52c984' : '#1e5c34', fontWeight:600 }}>Bintang Toedjoe</span>
            {' '}untuk perhitungan dan pelaporan formula batch produksi.
          </p>

          <p className="u5" style={{
            fontSize:'12.5px', fontWeight:400, lineHeight:1.65,
            color: isDark ? '#3a5040' : '#8aaa8e',
          }}>
            Gunakan menu di samping untuk mulai bekerja.
          </p>

        </div>
      </div>
    </>
  )
}