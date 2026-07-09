import { Building2, Menu, X } from 'lucide-react';
import type { NavLink } from './types';

interface NavbarProps {
  ministryName: string;
  logoSrc: string | null;
  accent: string;
  scrolled: boolean;
  menuOpen: boolean;
  onMenuToggle: () => void;
  onMenuClose: () => void;
  navLinks: NavLink[];
  onSignIn: () => void;
  activeHref?: string;
}

export function Navbar({
  ministryName,
  logoSrc,
  accent,
  scrolled,
  menuOpen,
  onMenuToggle,
  onMenuClose,
  navLinks,
  onSignIn,
  activeHref = '#home',
}: NavbarProps) {
  return (
    <>
      <style>{`
        @media (max-width: 960px) {
          .cp-desktop-nav { display: none !important; }
          .cp-desktop-cta { display: none !important; }
          .cp-hamburger { display: flex !important; }
        }
        @media (min-width: 961px) {
          .cp-hamburger { display: none !important; }
        }
      `}</style>

      <nav className="cp-navbar" style={{
        position: 'sticky',
        top: 0,
        zIndex: 1000,
        background: '#fff',
        boxShadow: scrolled ? '0 10px 28px rgba(16,24,40,0.08)' : '0 1px 0 rgba(16,24,40,0.08)',
        padding: '0 28px',
      }}>
        <div className="cp-nav-inner" style={{
          maxWidth: 1400,
          margin: '0 auto',
          height: 66,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 22,
        }}>
          <a href="#home" style={{ display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none', minWidth: 0 }}>
            {logoSrc ? (
              <img src={logoSrc} alt={ministryName} style={{
                width: 46,
                height: 46,
                borderRadius: 14,
                objectFit: 'cover',
                border: `1px solid ${accent}`,
              }} />
            ) : (
              <span style={{
                width: 46,
                height: 46,
                borderRadius: 14,
                background: accent,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#101a30',
              }}>
                <Building2 size={24} />
              </span>
            )}
            <span className="cp-brand-name" style={{
              fontFamily: 'Georgia, "Times New Roman", serif',
              fontSize: 24,
              fontWeight: 700,
              color: '#101a30',
              letterSpacing: 0,
              whiteSpace: 'nowrap',
            }}>
              {ministryName}
            </span>
          </a>

          <div className="cp-desktop-nav" style={{ display: 'flex', alignItems: 'center', gap: 30 }}>
            {navLinks.map(link => {
              const active = activeHref === link.href;
              return (
                <a
                  key={link.href}
                  href={link.href}
                  style={{
                    color: active ? '#101a30' : '#4f5868',
                    fontSize: 17,
                    fontWeight: 500,
                    textDecoration: 'none',
                    padding: '23px 0 18px',
                    borderBottom: `3px solid ${active ? accent : 'transparent'}`,
                    transition: 'color 0.2s, border-color 0.2s',
                  }}
                >
                  {link.label}
                </a>
              );
            })}
          </div>

          <div className="cp-desktop-cta" style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
            <button
              type="button"
              onClick={onSignIn}
              style={{
                background: 'none',
                border: 'none',
                padding: 0,
                cursor: 'pointer',
                color: '#101a30',
                fontSize: 16,
                fontWeight: 600,
              }}
            >
              Sign In
            </button>
            <a href="#visit" style={{
              background: accent,
              color: '#101a30',
              textDecoration: 'none',
              fontSize: 16,
              fontWeight: 700,
              padding: '13px 22px',
              borderRadius: 12,
              boxShadow: '0 12px 28px rgba(197,137,16,0.20)',
            }}>
              Plan a Visit
            </a>
          </div>

          <button
            type="button"
            onClick={onMenuToggle}
            className="cp-hamburger"
            style={{
              display: 'none',
              alignItems: 'center',
              justifyContent: 'center',
              width: 42,
              height: 42,
              borderRadius: 12,
              border: '1px solid rgba(16,24,40,0.12)',
              background: '#fff',
              color: '#101a30',
              cursor: 'pointer',
            }}
            aria-label="Toggle menu"
          >
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {menuOpen && (
          <div className="cp-mobile-menu" style={{
            maxWidth: 1400,
            margin: '0 auto',
            padding: '8px 0 18px',
            background: '#fff',
            borderTop: '1px solid rgba(16,24,40,0.08)',
          }}>
            {navLinks.map(link => (
              <a
                key={link.href}
                href={link.href}
                onClick={onMenuClose}
                style={{
                  display: 'block',
                  padding: '13px 2px',
                  color: activeHref === link.href ? '#101a30' : '#4f5868',
                  fontSize: 16,
                  fontWeight: 600,
                  textDecoration: 'none',
                  borderBottom: '1px solid rgba(16,24,40,0.08)',
                }}
              >
                {link.label}
              </a>
            ))}
            <button
              type="button"
              onClick={() => {
                onMenuClose();
                onSignIn();
              }}
              style={{
                display: 'block',
                width: '100%',
                padding: '13px 2px',
                background: 'none',
                border: 'none',
                borderBottom: '1px solid rgba(16,24,40,0.08)',
                color: '#4f5868',
                fontSize: 16,
                fontWeight: 600,
                textAlign: 'left',
              }}
            >
              Sign In
            </button>
          </div>
        )}
      </nav>
    </>
  );
}
