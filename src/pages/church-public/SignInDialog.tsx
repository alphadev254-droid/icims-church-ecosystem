import { useState } from 'react';
import { useAuthStore } from '@/stores/authStore';

interface SignInDialogProps {
  open: boolean;
  onClose: () => void;
  accent: string;
  ministryName: string;
  logoInitial: string;
}

export function SignInDialog({ open, onClose, accent, ministryName, logoInitial }: SignInDialogProps) {
  const login = useAuthStore(s => s.login);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const result = await login(email, password);
    setLoading(false);
    if (result.success) {
      window.location.href = result.redirectTo ?? '/dashboard';
    } else {
      setError(result.message || 'Invalid email or password');
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 2000,
          background: 'rgba(0,0,0,0.75)',
        }}
      />

      {/* Dialog — two-panel */}
      <div style={{
        position: 'fixed', zIndex: 2001,
        top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        display: 'flex',
        width: '100%', maxWidth: 860,
        maxHeight: '90vh',
        overflow: 'hidden',
        boxShadow: '0 40px 100px rgba(0,0,0,0.4)',
      }}>

        {/* ── LEFT PANEL — dark ── */}
        <div style={{
          width: '42%', flexShrink: 0,
          background: '#1c1f2e',
          padding: '48px 40px',
          display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
        }}>
          {/* Logo + name */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 36, height: 36,
              border: '1px solid rgba(255,255,255,0.4)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'Georgia, serif', fontSize: 15, fontWeight: 700,
              color: '#fff',
            }}>{logoInitial}</div>
            <span style={{
              fontFamily: 'Georgia, serif',
              fontSize: 14, fontWeight: 700, color: '#fff',
              letterSpacing: '0.04em',
            }}>{ministryName}</span>
          </div>

          {/* Middle content */}
          <div>
            <p style={{
              fontSize: 10, fontWeight: 600, letterSpacing: '0.22em',
              textTransform: 'uppercase', color: accent || '#c9a96e',
              marginBottom: 20,
            }}>Members</p>
            <h2 style={{
              fontFamily: 'Georgia, "Times New Roman", serif',
              fontSize: 32, fontWeight: 400, color: '#fff',
              lineHeight: 1.2, marginBottom: 20,
            }}>
              Welcome<br />back home.
            </h2>
            <p style={{
              fontSize: 13, color: 'rgba(255,255,255,0.55)',
              lineHeight: 1.7, maxWidth: 220,
            }}>
              Sign in to access prayer requests, giving history, and member-only resources.
            </p>
          </div>

          {/* Bottom tagline */}
          <p style={{
            fontSize: 10, fontWeight: 600, letterSpacing: '0.22em',
            textTransform: 'uppercase', color: 'rgba(255,255,255,0.25)',
          }}>Soli Deo Gloria</p>
        </div>

        {/* ── RIGHT PANEL — cream ── */}
        <div style={{
          flex: 1,
          background: '#faf8f4',
          padding: '48px 44px',
          position: 'relative',
          overflowY: 'auto',
        }}>
          {/* Close button */}
          <button
            onClick={onClose}
            style={{
              position: 'absolute', top: 20, right: 20,
              background: 'none', border: 'none', cursor: 'pointer',
              fontSize: 18, color: '#aaa', lineHeight: 1, padding: 4,
            }}
            aria-label="Close"
          >✕</button>

          {/* Form header */}
          <p style={{
            fontSize: 10, fontWeight: 600, letterSpacing: '0.22em',
            textTransform: 'uppercase', color: accent || '#c9a96e',
            marginBottom: 12,
          }}>Sign In</p>
          <h3 style={{
            fontFamily: 'Georgia, "Times New Roman", serif',
            fontSize: 26, fontWeight: 400, color: '#0a0a0a',
            marginBottom: 36, lineHeight: 1.2,
          }}>Enter your account.</h3>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {/* Email field */}
            <div style={{ marginBottom: 24 }}>
              <label style={{
                display: 'block', fontSize: 10, fontWeight: 600,
                letterSpacing: '0.18em', textTransform: 'uppercase',
                color: accent || '#c9a96e', marginBottom: 10,
              }}>Email</label>
              <div style={{ display: 'flex', alignItems: 'center', borderBottom: '1px solid #ccc', paddingBottom: 8 }}>
                <span style={{ color: '#aaa', marginRight: 10, fontSize: 14 }}>✉</span>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  style={{
                    flex: 1, border: 'none', outline: 'none',
                    fontSize: 14, color: '#0a0a0a',
                    background: 'transparent',
                    fontFamily: 'inherit',
                  }}
                />
              </div>
            </div>

            {/* Password field */}
            <div style={{ marginBottom: 12 }}>
              <label style={{
                display: 'block', fontSize: 10, fontWeight: 600,
                letterSpacing: '0.18em', textTransform: 'uppercase',
                color: accent || '#c9a96e', marginBottom: 10,
              }}>Password</label>
              <div style={{ display: 'flex', alignItems: 'center', borderBottom: '1px solid #ccc', paddingBottom: 8 }}>
                <span style={{ color: '#aaa', marginRight: 10, fontSize: 14 }}>🔒</span>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  style={{
                    flex: 1, border: 'none', outline: 'none',
                    fontSize: 14, color: '#0a0a0a',
                    background: 'transparent',
                    fontFamily: 'inherit',
                  }}
                />
              </div>
            </div>

            {/* Forgot password */}
            <div style={{ textAlign: 'right', marginBottom: 28 }}>
              <a
                href="https://churchcentral.church/forgot-password"
                style={{
                  fontSize: 12, color: '#888', textDecoration: 'none',
                  transition: 'color 0.2s',
                }}
                onMouseEnter={e => (e.currentTarget as HTMLAnchorElement).style.color = '#0a0a0a'}
                onMouseLeave={e => (e.currentTarget as HTMLAnchorElement).style.color = '#888'}
              >
                Forgot password?
              </a>
            </div>

            {/* Error */}
            {error && (
              <p style={{ fontSize: 13, color: '#c0392b', marginBottom: 16 }}>{error}</p>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '16px',
                background: '#0a0a0a',
                color: '#fff',
                border: 'none',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: 13, fontWeight: 600,
                letterSpacing: '0.08em',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                opacity: loading ? 0.7 : 1,
                transition: 'opacity 0.2s',
                marginBottom: 28,
              }}
            >
              {loading ? 'Signing in…' : <>Sign In <span style={{ fontSize: 16 }}>↗</span></>}
            </button>

            {/* Divider */}
            <div style={{ borderTop: '1px solid #e8e4de', marginBottom: 24 }} />

            {/* Register link */}
            <p style={{ textAlign: 'center', fontSize: 13, color: '#888', margin: 0 }}>
              New here?{' '}
              <a
                href="https://churchcentral.church/register"
                style={{
                  color: '#0a0a0a', fontWeight: 600,
                  textDecoration: 'underline', textUnderlineOffset: 3,
                }}
              >
                Create an account
              </a>
            </p>
          </form>
        </div>
      </div>
    </>
  );
}
