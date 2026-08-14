// frontend/src/components/pages/LoginPage.tsx
import { useState, useEffect, type FormEvent } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { Eye, EyeOff, Lock, User } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // Notifikasi saat diarahkan kembali ke halaman ini karena Auto Logout (idle timeout)
  const idleTimeoutState = (location.state as { idleTimeout?: boolean } | null)?.idleTimeout
  const [idleNotice, setIdleNotice] = useState(!!idleTimeoutState)

  useEffect(() => {
    if (idleTimeoutState) {
      // Bersihkan state agar notifikasi tidak muncul lagi saat navigasi/refresh berikutnya
      navigate(location.pathname, { replace: true, state: {} })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setIdleNotice(false)
    setLoading(true)
    try {
      await login(username, password)
      navigate('/welcome')
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined
      setError(msg ?? 'Username atau password salah')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap');

        *, *::before, *::after { box-sizing: border-box; }

        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes spin   { to { transform: rotate(360deg); } }
        @keyframes floatSlow {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          50%      { transform: translate(-14px, 18px) rotate(6deg); }
        }
        @keyframes floatSlowReverse {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          50%      { transform: translate(16px, -14px) rotate(-5deg); }
        }
        @keyframes pulseRing {
          0%   { opacity: 0.10; transform: scale(1); }
          50%  { opacity: 0.18; transform: scale(1.03); }
          100% { opacity: 0.10; transform: scale(1); }
        }

        .bfc-hero  { animation: fadeIn 0.5s ease both; }
        .bfc-form  { animation: fadeInUp 0.5s cubic-bezier(0.16,1,0.3,1) 0.08s both; }
        .bfc-ring-1 { animation: floatSlow 9s ease-in-out infinite, pulseRing 6s ease-in-out infinite; }
        .bfc-ring-2 { animation: floatSlowReverse 11s ease-in-out infinite; }
        .bfc-logo    { animation: fadeInUp 0.6s cubic-bezier(0.16,1,0.3,1) 0.05s both; }
        .bfc-title   { animation: fadeInUp 0.6s cubic-bezier(0.16,1,0.3,1) 0.16s both; }
        .bfc-subtitle{ animation: fadeInUp 0.6s cubic-bezier(0.16,1,0.3,1) 0.28s both; }

        .bfc-input {
          width: 100%;
          background: #fff;
          border: 1.5px solid #DDE3DC;
          border-radius: 10px;
          padding: 11px 14px 11px 42px;
          font-size: 14px;
          font-family: 'Plus Jakarta Sans', sans-serif;
          color: #1A2E1C;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .bfc-input::placeholder { color: #9AA79C; }
        .bfc-input:focus {
          border-color: #2D6A4F;
          box-shadow: 0 0 0 3.5px rgba(45,106,79,0.13);
        }

        .bfc-btn {
          width: 100%;
          padding: 13px;
          background: #1B4332;
          color: #fff;
          font-weight: 700;
          font-size: 15px;
          letter-spacing: 0.02em;
          border: none;
          border-radius: 10px;
          cursor: pointer;
          font-family: 'Plus Jakarta Sans', sans-serif;
          transition: background 0.18s, transform 0.1s, box-shadow 0.18s;
          box-shadow: 0 4px 14px rgba(27,67,50,0.25);
        }
        .bfc-btn:hover:not(:disabled) {
          background: #2D6A4F;
          box-shadow: 0 6px 20px rgba(27,67,50,0.32);
        }
        .bfc-btn:active:not(:disabled) { transform: scale(0.985); }
        .bfc-btn:disabled { opacity: 0.65; cursor: not-allowed; }

        .spinner {
          display: inline-block; width: 15px; height: 15px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: #fff; border-radius: 50%;
          animation: spin 0.65s linear infinite;
          vertical-align: middle; margin-right: 8px;
        }

        .bfc-login-root {
          min-height: 100vh;
          display: flex;
          font-family: 'Plus Jakarta Sans', sans-serif;
          background: #F5F0E8;
        }

        .bfc-login-left {
          width: 62%;
          min-height: 100vh;
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          justify-content: center;
          padding: 0 72px;
          background: linear-gradient(155deg, #1B4332 0%, #2D6A4F 100%);
          overflow: hidden;
        }

        .bfc-login-right {
          width: 38%;
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 40px;
        }

        .bfc-form-card {
          width: 100%;
          background: #ffffff;
          border-radius: 18px;
          padding: 44px 40px;
          box-shadow: 0 10px 40px rgba(27,67,50,0.10), 0 2px 8px rgba(27,67,50,0.06);
        }

        @media (max-width: 900px) {
          .bfc-login-root { flex-direction: column; }
          .bfc-login-left,
          .bfc-login-right { width: 100%; }
          .bfc-login-left { min-height: auto; padding: 48px 32px; }
          .bfc-login-right { min-height: auto; padding: 40px 24px 64px; }
          .bfc-logo { height: 100px !important; }
        }

        @media (max-width: 480px) {
          .bfc-login-left { padding: 40px 24px; }
          .bfc-logo { height: 76px !important; }
        }
      `}</style>

      <div className="bfc-login-root">
        {/* ── LEFT — Hero Section (polos, tanpa card/carousel) ─────────── */}
        <div className="bfc-login-left bfc-hero">
          {/* Pola dekoratif minimalis */}
          <svg
            aria-hidden
            className="bfc-ring-1"
            width="420" height="420" viewBox="0 0 420 420"
            style={{ position: 'absolute', top: '-90px', right: '-110px', opacity: 0.10, pointerEvents: 'none' }}
          >
            <circle cx="210" cy="210" r="209" stroke="#fff" strokeWidth="1" fill="none" />
            <circle cx="210" cy="210" r="150" stroke="#fff" strokeWidth="1" fill="none" />
          </svg>
          <svg
            aria-hidden
            className="bfc-ring-2"
            width="260" height="260" viewBox="0 0 260 260"
            style={{ position: 'absolute', bottom: '-70px', left: '-60px', opacity: 0.08, pointerEvents: 'none' }}
          >
            <circle cx="130" cy="130" r="129" stroke="#fff" strokeWidth="1" fill="none" />
          </svg>

          <div style={{ position: 'relative', zIndex: 1 }}>
            <img
              src="/src/assets/B7-logo-white.png"
              alt="Bintang Toedjoe"
              className="bfc-logo"
              style={{
                position: 'absolute',
                bottom: '100%',
                left: 0,
                marginBottom: '28px',
                height: '190px',
                objectFit: 'contain',
              }}
            />

            <h1 className="bfc-title" style={{
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontSize: 'clamp(3.25rem, 5.4vw, 4.75rem)',
              fontWeight: 800,
              lineHeight: 1.1,
              letterSpacing: '-0.01em',
              color: '#fff',
              marginBottom: '28px',
            }}>
              Batch Formula<br />Calculation
            </h1>

            <p className="bfc-subtitle" style={{
              color: 'rgba(255,255,255,0.85)',
              fontSize: '19px',
              lineHeight: 1.8,
              maxWidth: '500px',
            }}>
              Sistem internal PT. Bintang Toedjoe untuk perhitungan formula
              Batch Khusus dan Batch Overfilled.
            </p>
          </div>
        </div>

        {/* ── RIGHT — Form Login (langsung, tanpa card putih) ───────────── */}
        <div className="bfc-login-right">
          <div className="bfc-form bfc-form-card" style={{ width: '100%', maxWidth: '380px' }}>
            <div style={{ marginBottom: '32px' }}>
              <h2 style={{
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontSize: '26px',
                fontWeight: 700,
                color: '#1A2E1C',
                marginBottom: '8px',
              }}>
                Sign In
              </h2>
              <p style={{ color: '#6B7A6D', fontSize: '14px' }}>
                Masukkan kredensial Anda untuk melanjutkan.
              </p>
            </div>

            {idleNotice && (
              <div style={{
                background: '#ECFDF5',
                border: '1px solid #A7D9BE',
                borderRadius: '8px',
                padding: '10px 14px',
                fontSize: '13px',
                color: '#1B4332',
                marginBottom: '20px',
                lineHeight: 1.5,
              }}>
                Sesi Anda telah berakhir karena tidak ada aktivitas selama 12 jam. Silakan login kembali.
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              {/* Username */}
              <div>
                <label style={{
                  display: 'block', marginBottom: '8px',
                  fontSize: '13px', fontWeight: 600, color: '#2E3B2F',
                }}>
                  Username
                </label>
                <div style={{ position: 'relative' }}>
                  <User size={15} style={{
                    position: 'absolute', left: '14px', top: '50%',
                    transform: 'translateY(-50%)', color: '#9AA79C', pointerEvents: 'none',
                  }} />
                  <input
                    type="text"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    required
                    placeholder="Masukkan username"
                    className="bfc-input"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label style={{
                  display: 'block', marginBottom: '8px',
                  fontSize: '13px', fontWeight: 600, color: '#2E3B2F',
                }}>
                  Password
                </label>
                <div style={{ position: 'relative' }}>
                  <Lock size={15} style={{
                    position: 'absolute', left: '14px', top: '50%',
                    transform: 'translateY(-50%)', color: '#9AA79C', pointerEvents: 'none',
                  }} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    className="bfc-input"
                    style={{ paddingRight: '44px' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(v => !v)}
                    style={{
                      position: 'absolute', right: '13px', top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none', border: 'none', cursor: 'pointer',
                      color: '#9AA79C', padding: '2px', lineHeight: 1,
                    }}
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              {error && (
                <div style={{
                  background: '#FEF2F2',
                  border: '1px solid #FCA5A5',
                  borderRadius: '8px',
                  padding: '10px 14px',
                  fontSize: '13px',
                  color: '#B91C1C',
                  textAlign: 'center',
                }}>
                  {error}
                </div>
              )}

              <button type="submit" disabled={loading} className="bfc-btn" style={{ marginTop: '4px' }}>
                {loading
                  ? <><span className="spinner" />Masuk...</>
                  : 'Sign in'
                }
              </button>
            </form>

            <p style={{
              marginTop: '22px',
              textAlign: 'center',
              fontSize: '13px',
              color: '#7A8A7C',
            }}>
              Belum punya akun?{' '}
              <Link
                to="/signup"
                style={{ color: '#1B4332', fontWeight: 600, textDecoration: 'none' }}
              >
                Daftar
              </Link>
            </p>
          </div>
        </div>
      </div>
    </>
  )
}