import { useState } from 'react';
import { Menu, X } from 'lucide-react';
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
}

export function Navbar({
  ministryName, logoSrc, accent, scrolled,
  menuOpen, onMenuToggle, onMenuClose, navLinks, onSignIn,
}: NavbarProps) {
  const initial = ministryName.charAt(0).toUpperCase();

  return (
    <>
      <style>{`
        @media (max-width: 768px) {
          .cp-desktop-nav { display: none !important; }
          .cp-desktop-cta { display: none !important; }
          .cp-hamburger { display: flex !important; }
        }
        @media (min-width: 769px) {
          .cp-hamburger { display: none !important; }
        }
      `}</style>

      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000,
        background: scrolled ? 'rgba(10,10,10,0.96)' : 'transparent',
        backdropFilter: scrolled ? 'blur(12px)' : 'none',
        transition: 'background 0.4s',
        padding: '0 40px',
      }}>
        <div style={{
          maxWidth: 1200, margin: '0 auto',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          height: 72,
        }}>
          {/* Logo */}
          <a href="#" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
            {logoSrc ? (
              <img src={logoSrc} alt={ministryName} style={{
                height: 36, width: 36, borderRadius: 4, objectFit: 'cover',
                border: '1px solid rgba(255,255,255,0.3)',
              }} />
            ) : (
              <div style={{
                height: 36, width: 36, border: '1px solid rgba(255,255,255,0.5)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'Georgia, serif', fontSize: 16, fontWeight: 700,
                color: '#fff',
              }}>{initial}</div>
            )}
            <span style={{
              fontFamily: 'Georgia, "Times New Roman", serif',
              fontSize: 15, fontWeight: 700, letterSpacing: '0.05em',
              color: '#fff',
            }}>{ministryName}</span>
          </a>

          {/* Desktop nav */}
          <div className="cp-desktop-nav" style={{ display: 'flex', gap: 36, alignItems: 'center' }}>
            {navLinks.map(link => (
              <a key={link.href} href={link.href} style={{
                fontSize: 13, fontWeight: 500, letterSpacing: '0.06em',
                color: 'rgba(255,255,255,0.80)', textDecoration: 'none',
                transition: 'color 0.2s',
              }}
              onMouseEnter={e => (e.currentTarget as HTMLAnchorElement).style.color = '#fff'}
              onMouseLeave={e => (e.currentTarget as HTMLAnchorElement).style.color = 'rgba(255,255,255,0.80)'}
              >{link.label}</a>
            ))}
          </div>

          {/* Desktop CTA */}
          <div className="cp-desktop-cta" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <button
              onClick={onSignIn}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                fontSize: 13, fontWeight: 500, letterSpacing: '0.06em',
                color: 'rgba(255,255,255,0.80)', padding: 0,
                transition: 'color 0.2s',
              }}
              onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.color = '#fff'}
              onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.80)'}
            >
              Sign In
            </button>
            <a href="#services" style={{
              fontSize: 13, fontWeight: 600, letterSpacing: '0.06em',
              color: '#fff', textDecoration: 'none',
              border: '1px solid rgba(255,255,255,0.6)',
              padding: '8px 20px',
              transition: 'background 0.2s, border-color 0.2s',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(255,255,255,0.1)';
              (e.currentTarget as HTMLAnchorElement).style.borderColor = '#fff';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLAnchorElement).style.background = 'transparent';
              (e.currentTarget as HTMLAnchorElement).style.borderColor = 'rgba(255,255,255,0.6)';
            }}
            >Plan a Visit ↗</a>
          </div>

          {/* Hamburger */}
          <button
            onClick={onMenuToggle}
            className="cp-hamburger"
            style={{
              background: 'none', border: 'none', cursor: 'pointer', padding: 6,
              color: '#fff', display: 'none',
            }}
            aria-label="Toggle menu"
          >
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div style={{
            background: 'rgba(10,10,10,0.98)',
            borderTop: '1px solid rgba(255,255,255,0.1)',
            padding: '16px 40px 24px',
          }}>
            {navLinks.map(link => (
              <a key={link.href} href={link.href}
                onClick={onMenuClose}
                style={{
                  display: 'block', padding: '14px 0',
                  fontSize: 15, fontWeight: 500, letterSpacing: '0.04em',
                  color: 'rgba(255,255,255,0.85)', textDecoration: 'none',
                  borderBottom: '1px solid rgba(255,255,255,0.08)',
                }}
              >{link.label}</a>
            ))}
          </div>
        )}
      </nav>
    </>
  );
}
