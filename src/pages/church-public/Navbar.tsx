import { useState, useEffect } from 'react';
import { Menu, X, Building2 } from 'lucide-react';
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
  ministryName, logoSrc, accent, scrolled, menuOpen,
  onMenuToggle, onMenuClose, navLinks, onSignIn, activeHref = '#home',
}: NavbarProps) {
  return (
    <>
      <style>{`
        .cpn-link { transition: color 0.18s; }
        .cpn-link:hover { color: #fff !important; }
        @media (max-width: 960px) {
          .cpn-desktop { display: none !important; }
          .cpn-hamburger { display: flex !important; }
        }
        @media (min-width: 961px) {
          .cpn-hamburger { display: none !important; }
        }
      `}</style>

      <nav style={{
        position: 'sticky', top: 0, zIndex: 1000,
        background: scrolled ? '#111822' : 'rgba(17,24,34,0.72)',
        backdropFilter: 'blur(12px)',
        borderBottom: scrolled ? '1px solid rgba(255,255,255,0.08)' : 'none',
        transition: 'background 0.3s, border-color 0.3s',
        padding: '0 28px',
      }} className="cp-navbar">
        <div style={{
          maxWidth: 1400, margin: '0 auto', height: 66,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 22,
        }} className="cp-nav-inner">

          {/* Brand */}
          <a href="#home" style={{ display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none', minWidth: 0 }}>
            {logoSrc ? (
              <img src={logoSrc} alt={ministryName} style={{
                width: 40, height: 40, borderRadius: 10, objectFit: 'cover',
                border: `1.5px solid ${accent}`,
              }} />
            ) : (
              <span style={{
                width: 40, height: 40, borderRadius: 10, background: accent,
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#111822',
              }}>
                <Building2 size={20} />
              </span>
            )}
            <span className="cp-brand-name" style={{
              fontFamily: 'Georgia, "Times New Roman", serif',
              fontSize: 20, fontWeight: 700, color: '#fff',
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 220,
            }}>
              {ministryName}
            </span>
          </a>

          {/* Desktop nav */}
          <div className="cpn-desktop" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {navLinks.map(link => {
              const active = activeHref === link.href;
              return (
                <a key={link.href} href={link.href} className="cpn-link" style={{
                  color: active ? '#fff' : 'rgba(255,255,255,0.62)',
                  fontSize: 14, fontWeight: 500, textDecoration: 'none',
                  padding: '8px 14px', borderRadius: 8,
                  background: active ? 'rgba(255,255,255,0.08)' : 'transparent',
                }}>
                  {link.label}
                </a>
              );
            })}
          </div>

          {/* Desktop CTA */}
          <div className="cpn-desktop" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button type="button" onClick={onSignIn} style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'rgba(255,255,255,0.72)', fontSize: 14, fontWeight: 500, padding: '8px 4px',
            }}>
              Sign In
            </button>
            <a href="#visit" style={{
              background: accent, color: '#111822', textDecoration: 'none',
              fontSize: 14, fontWeight: 700, padding: '10px 20px', borderRadius: 8,
            }}>
              Plan a Visit
            </a>
          </div>

          {/* Hamburger */}
          <button type="button" onClick={onMenuToggle} className="cpn-hamburger" style={{
            display: 'none', alignItems: 'center', justifyContent: 'center',
            width: 40, height: 40, borderRadius: 8,
            border: '1px solid rgba(255,255,255,0.18)', background: 'rgba(255,255,255,0.06)',
            color: '#fff', cursor: 'pointer',
          }} aria-label="Toggle menu">
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div style={{
            maxWidth: 1400, margin: '0 auto', padding: '8px 0 16px',
            borderTop: '1px solid rgba(255,255,255,0.08)',
          }} className="cp-mobile-menu">
            {navLinks.map(link => (
              <a key={link.href} href={link.href} onClick={onMenuClose} style={{
                display: 'block', padding: '12px 4px',
                color: activeHref === link.href ? '#fff' : 'rgba(255,255,255,0.65)',
                fontSize: 15, fontWeight: 500, textDecoration: 'none',
                borderBottom: '1px solid rgba(255,255,255,0.06)',
              }}>
                {link.label}
              </a>
            ))}
            <button type="button" onClick={() => { onMenuClose(); onSignIn(); }} style={{
              display: 'block', width: '100%', padding: '12px 4px',
              background: 'none', border: 'none', borderBottom: '1px solid rgba(255,255,255,0.06)',
              color: 'rgba(255,255,255,0.65)', fontSize: 15, fontWeight: 500, textAlign: 'left', cursor: 'pointer',
            }}>
              Sign In
            </button>
            <a href="#visit" onClick={onMenuClose} style={{
              display: 'block', marginTop: 12, padding: '13px 20px', textAlign: 'center',
              background: accent, color: '#111822', borderRadius: 8,
              fontWeight: 700, fontSize: 15, textDecoration: 'none',
            }}>
              Plan a Visit
            </a>
          </div>
        )}
      </nav>
    </>
  );
}
