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
}

export function Navbar({
  ministryName, logoSrc, accent, scrolled,
  menuOpen, onMenuToggle, onMenuClose, navLinks,
}: NavbarProps) {
  return (
    <>
      <style>{`
        @media (max-width: 640px) {
          .cp-desktop-nav { display: none !important; }
          .cp-hamburger { display: flex !important; }
        }
        @media (min-width: 641px) {
          .cp-hamburger { display: none !important; }
        }
      `}</style>

      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000,
        background: scrolled ? 'rgba(255,255,255,0.97)' : 'transparent',
        backdropFilter: scrolled ? 'blur(12px)' : 'none',
        boxShadow: scrolled ? '0 1px 12px rgba(0,0,0,0.10)' : 'none',
        transition: 'background 0.3s, box-shadow 0.3s',
        padding: '0 24px',
      }}>
        <div style={{
          maxWidth: 1100, margin: '0 auto',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          height: 64,
        }}>
          {/* Logo + name */}
          <a href="#" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
            {logoSrc ? (
              <img src={logoSrc} alt={ministryName} style={{
                height: 38, width: 38, borderRadius: '50%', objectFit: 'cover',
                border: `2px solid ${scrolled ? accent + '55' : 'rgba(255,255,255,0.5)'}`,
              }} />
            ) : (
              <div style={{
                height: 38, width: 38, borderRadius: '50%',
                background: `${accent}33`, border: `2px solid ${accent}66`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
              }}>⛪</div>
            )}
            <span style={{
              fontWeight: 800, fontSize: 15,
              color: scrolled ? '#111' : '#fff',
              transition: 'color 0.3s',
              maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>{ministryName}</span>
          </a>

          {/* Desktop links */}
          <div style={{ display: 'flex', gap: 4, alignItems: 'center' }} className="cp-desktop-nav">
            {navLinks.map(link => (
              <a key={link.href} href={link.href} style={{
                padding: '6px 14px', fontSize: 14, fontWeight: 600,
                color: scrolled ? '#374151' : 'rgba(255,255,255,0.88)',
                textDecoration: 'none', borderRadius: 6,
                transition: 'color 0.2s',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.color = accent; }}
              onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.color = scrolled ? '#374151' : 'rgba(255,255,255,0.88)'; }}
              >{link.label}</a>
            ))}
          </div>

          {/* Hamburger */}
          <button
            onClick={onMenuToggle}
            style={{
              background: 'none', border: 'none', cursor: 'pointer', padding: 6,
              color: scrolled ? '#111' : '#fff', display: 'none',
            }}
            className="cp-hamburger"
            aria-label="Toggle menu"
          >
            {menuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div style={{ background: '#fff', borderTop: '1px solid #f3f4f6', padding: '12px 24px 20px' }}>
            {navLinks.map(link => (
              <a key={link.href} href={link.href}
                onClick={onMenuClose}
                style={{
                  display: 'block', padding: '12px 0',
                  fontSize: 16, fontWeight: 600, color: '#374151',
                  textDecoration: 'none', borderBottom: '1px solid #f3f4f6',
                }}
              >{link.label}</a>
            ))}
          </div>
        )}
      </nav>
    </>
  );
}
