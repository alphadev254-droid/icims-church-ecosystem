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
        .cpn-link:hover { color: #121D39 !important; }
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
        background: '#fff',
        borderBottom: '1px solid #e8edf5',
        boxShadow: scrolled ? '0 2px 12px rgba(0,0,0,0.08)' : 'none',
        transition: 'box-shadow 0.3s',
        padding: '0 28px',
      }} className="cp-navbar">
        <div style={{
          maxWidth: 1400, margin: '0 auto', height: 62,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 22,
        }} className="cp-nav-inner">

          {/* Brand */}
          <a href="#home" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', minWidth: 0 }}>
            {logoSrc ? (
              <img src={logoSrc} alt={ministryName} style={{
                width: 36, height: 36, borderRadius: 8, objectFit: 'cover',
                border: `1.5px solid ${accent}`,
              }} />
            ) : (
              <span style={{
                width: 36, height: 36, borderRadius: 8, background: accent,
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#121D39',
              }}>
                <Building2 size={18} />
              </span>
            )}
            <span className="cp-brand-name" style={{
              fontFamily: 'Georgia, "Times New Roman", serif',
              fontSize: 18, fontWeight: 700, color: '#121D39',
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 220,
            }}>
              {ministryName}
            </span>
          </a>

          {/* Desktop nav */}
          <div className="cpn-desktop" style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {navLinks.map(link => {
              const active = activeHref === link.href;
              return (
                <a key={link.href} href={link.href} className="cpn-link" style={{
                  color: active ? '#121D39' : '#475569',
                  fontSize: 14, fontWeight: active ? 600 : 500, textDecoration: 'none',
                  padding: '8px 13px', borderRadius: 7,
                  background: active ? `${accent}18` : 'transparent',
                  borderBottom: active ? `2px solid ${accent}` : '2px solid transparent',
                }}>
                  {link.label}
                </a>
              );
            })}
          </div>

          {/* Desktop CTA */}
          <div className="cpn-desktop" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button type="button" onClick={onSignIn} style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: '#475569', fontSize: 14, fontWeight: 500, padding: '8px 4px',
            }}>
              Sign In
            </button>
            <a href="#visit" style={{
              background: accent, color: '#121D39', textDecoration: 'none',
              fontSize: 13, fontWeight: 700, padding: '9px 18px', borderRadius: 7,
            }}>
              Plan a Visit
            </a>
          </div>

          {/* Hamburger */}
          <button type="button" onClick={onMenuToggle} className="cpn-hamburger" style={{
            display: 'none', alignItems: 'center', justifyContent: 'center',
            width: 38, height: 38, borderRadius: 7,
            border: '1px solid #e2e8f0', background: '#f8fafc',
            color: '#121D39', cursor: 'pointer',
          }} aria-label="Toggle menu">
            {menuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div style={{
            maxWidth: 1400, margin: '0 auto', padding: '8px 0 14px',
            borderTop: '1px solid #e8edf5', background: '#fff',
          }} className="cp-mobile-menu">
            {navLinks.map(link => (
              <a key={link.href} href={link.href} onClick={onMenuClose} style={{
                display: 'block', padding: '11px 4px',
                color: activeHref === link.href ? '#121D39' : '#475569',
                fontSize: 14, fontWeight: activeHref === link.href ? 600 : 500,
                textDecoration: 'none',
                borderBottom: '1px solid #f1f5f9',
              }}>
                {link.label}
              </a>
            ))}
            <button type="button" onClick={() => { onMenuClose(); onSignIn(); }} style={{
              display: 'block', width: '100%', padding: '11px 4px',
              background: 'none', border: 'none', borderBottom: '1px solid #f1f5f9',
              color: '#475569', fontSize: 14, fontWeight: 500, textAlign: 'left', cursor: 'pointer',
            }}>
              Sign In
            </button>
            <a href="#visit" onClick={onMenuClose} style={{
              display: 'block', marginTop: 10, padding: '12px 18px', textAlign: 'center',
              background: accent, color: '#121D39', borderRadius: 7,
              fontWeight: 700, fontSize: 14, textDecoration: 'none',
            }}>
              Plan a Visit
            </a>
          </div>
        )}
      </nav>
    </>
  );
}
