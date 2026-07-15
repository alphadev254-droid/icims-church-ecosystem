import { useState } from 'react';
import { Lock, Mail, X } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';

interface SignInDialogProps {
  open: boolean;
  onClose: () => void;
  accent: string;
  ministryName: string;
  logoInitial: string;
  mode?: 'default' | 'check-in';
  contextTitle?: string;
  contextDescription?: string;
  submitLabel?: string;
  onSuccess?: () => void | Promise<void>;
}

const DARK = '#121D39';

export function SignInDialog({
  open,
  onClose,
  accent,
  ministryName,
  logoInitial,
  mode = 'default',
  contextTitle,
  contextDescription,
  submitLabel,
  onSuccess,
}: SignInDialogProps) {
  const login = useAuthStore(s => s.login);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const isCheckIn = mode === 'check-in';

  if (!open) return null;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setLoading(true);
    const result = await login(email, password);
    setLoading(false);

    if (result.success) {
      if (onSuccess) {
        await onSuccess();
        return;
      }

      const isSubdomain = window.location.hostname !== 'churchcentral.church' && window.location.hostname !== 'localhost';
      const redirectPath = result.redirectTo ?? '/dashboard';
      window.location.href = isSubdomain ? `https://churchcentral.church${redirectPath}` : redirectPath;
      return;
    }

    setError(result.message || 'Invalid email or password');
  };

  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 2000,
          background: 'rgba(4,10,24,0.78)',
          backdropFilter: 'blur(6px)',
        }}
      />

      <div className="cp-auth-dialog" style={{
        position: 'fixed',
        zIndex: 2001,
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        display: 'grid',
        gridTemplateColumns: 'minmax(260px, 0.82fr) minmax(320px, 1.18fr)',
        width: 'calc(100% - 32px)',
        maxWidth: 880,
        maxHeight: '90vh',
        overflow: 'hidden',
        borderRadius: 18,
        border: '1px solid rgba(255,255,255,0.12)',
        background: DARK,
        boxShadow: '0 40px 120px rgba(0,0,0,0.48)',
      }}>
        <div className="cp-auth-side" style={{
          background: '#0A0F1E',
          padding: '38px 34px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          gap: 40,
          borderRight: '1px solid rgba(255,255,255,0.08)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
            <div style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              background: accent,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: 'Georgia, serif',
              fontSize: 17,
              fontWeight: 800,
              color: DARK,
              flexShrink: 0,
            }}>
              {logoInitial}
            </div>
            <span style={{
              fontFamily: 'Georgia, serif',
              fontSize: 17,
              fontWeight: 800,
              color: '#fff',
              lineHeight: 1.2,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}>
              {ministryName}
            </span>
          </div>

          <div>
            <p style={{
              fontSize: 10,
              fontWeight: 800,
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
              color: accent,
              margin: '0 0 16px',
            }}>
              {isCheckIn ? 'Attendance' : 'Members'}
            </p>
            <h2 style={{
              fontFamily: 'Georgia, "Times New Roman", serif',
              fontSize: 'clamp(2rem, 4vw, 3rem)',
              fontWeight: 800,
              color: '#fff',
              lineHeight: 1.08,
              margin: '0 0 18px',
            }}>
              {isCheckIn ? 'Sign in to check in.' : 'Welcome back home.'}
            </h2>
            <p style={{
              fontSize: 14,
              color: 'rgba(255,255,255,0.68)',
              lineHeight: 1.7,
              maxWidth: 280,
              margin: 0,
            }}>
              {isCheckIn
                ? `Use your ${ministryName} member account to mark yourself present for this service.`
                : 'Sign in to access prayer requests, giving history, and member-only resources.'}
            </p>
          </div>

          <p style={{
            fontSize: 10,
            fontWeight: 800,
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
            color: 'rgba(255,255,255,0.35)',
            margin: 0,
          }}>
            Faith, Hope, Love
          </p>
        </div>

        <div className="cp-auth-main" style={{
          position: 'relative',
          overflowY: 'auto',
          background: DARK,
          padding: '42px clamp(24px, 4vw, 46px)',
        }}>
          <button
            onClick={onClose}
            style={{
              position: 'absolute',
              top: 18,
              right: 18,
              width: 34,
              height: 34,
              borderRadius: 8,
              border: '1px solid rgba(255,255,255,0.12)',
              background: 'rgba(255,255,255,0.04)',
              color: 'rgba(255,255,255,0.72)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            aria-label="Close"
          >
            <X size={17} />
          </button>

          <p style={{
            fontSize: 10,
            fontWeight: 800,
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
            color: accent,
            margin: '0 0 12px',
          }}>
            {isCheckIn ? 'Member Check-in' : 'Sign In'}
          </p>
          <h3 style={{
            fontFamily: 'Georgia, "Times New Roman", serif',
            fontSize: 'clamp(1.8rem, 4vw, 2.6rem)',
            fontWeight: 800,
            color: '#fff',
            lineHeight: 1.12,
            margin: '0 0 28px',
          }}>
            {contextTitle || (isCheckIn ? 'Enter your account to continue.' : 'Enter your account.')}
          </h3>
          {contextDescription && (
            <p style={{
              color: 'rgba(255,255,255,0.68)',
              fontSize: 14,
              lineHeight: 1.6,
              margin: '-16px 0 24px',
            }}>
              {contextDescription}
            </p>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <label style={labelStyle}>
              <span>Email</span>
              <div style={fieldStyle}>
                <Mail size={17} color="rgba(255,255,255,0.48)" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={event => setEmail(event.target.value)}
                  placeholder="you@example.com"
                  style={inputStyle}
                />
              </div>
            </label>

            <label style={labelStyle}>
              <span>Password</span>
              <div style={fieldStyle}>
                <Lock size={17} color="rgba(255,255,255,0.48)" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={event => setPassword(event.target.value)}
                  placeholder="Enter password"
                  style={inputStyle}
                />
              </div>
            </label>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: -4 }}>
              <a
                href="https://churchcentral.church/forgot-password"
                style={{
                  fontSize: 13,
                  color: 'rgba(255,255,255,0.62)',
                  textDecoration: 'none',
                }}
              >
                Forgot password?
              </a>
            </div>

            {error && (
              <p style={{
                fontSize: 13,
                color: '#fecaca',
                background: 'rgba(220,38,38,0.14)',
                border: '1px solid rgba(248,113,113,0.22)',
                borderRadius: 8,
                padding: '10px 12px',
                margin: 0,
              }}>
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                marginTop: 8,
                padding: '15px 18px',
                borderRadius: 8,
                background: accent,
                color: DARK,
                border: 'none',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: 14,
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                opacity: loading ? 0.72 : 1,
              }}
            >
              {loading ? 'Signing in...' : <>{submitLabel || (isCheckIn ? 'Sign In & Check In' : 'Sign In')} <span aria-hidden="true">-&gt;</span></>}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}

const labelStyle: React.CSSProperties = {
  display: 'grid',
  gap: 8,
  color: '#fff',
  fontSize: 10,
  fontWeight: 800,
  letterSpacing: '0.18em',
  textTransform: 'uppercase',
};

const fieldStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  minHeight: 50,
  borderRadius: 10,
  border: '1px solid rgba(255,255,255,0.12)',
  background: 'rgba(255,255,255,0.06)',
  padding: '0 14px',
};

const inputStyle: React.CSSProperties = {
  flex: 1,
  minWidth: 0,
  border: 'none',
  outline: 'none',
  fontSize: 15,
  color: '#fff',
  background: 'transparent',
  fontFamily: 'inherit',
};
