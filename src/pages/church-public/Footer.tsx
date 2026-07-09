import { Building2, Facebook, Instagram, Mail, MapPin, Phone, Youtube } from 'lucide-react';
import type React from 'react';
import type { NavLink, Profile } from './types';

interface FooterProps {
  ministryName: string;
  logoSrc: string | null;
  profile: Profile;
  accent: string;
  navLinks: NavLink[];
}

export function Footer({ ministryName, logoSrc, profile, accent, navLinks }: FooterProps) {
  const year = new Date().getFullYear();
  const explore = navLinks.filter(link => !['#home', '#contact'].includes(link.href)).slice(0, 5);

  return (
    <footer className="cp-footer" style={{
      background: 'linear-gradient(120deg, #111822 0%, #14213a 68%, #303846 100%)',
      color: '#fff',
      padding: '72px 28px 42px',
    }}>
      <div style={{
        maxWidth: 1400,
        margin: '0 auto',
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1.25fr) minmax(180px, 0.65fr) minmax(260px, 0.75fr)',
        gap: 80,
      }} className="cp-contact-grid">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
            {logoSrc ? (
              <img src={logoSrc} alt="" style={{ width: 42, height: 42, borderRadius: 12, objectFit: 'cover' }} />
            ) : (
              <span style={{ width: 42, height: 42, borderRadius: 12, background: accent, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#101a30' }}>
                <Building2 size={22} />
              </span>
            )}
            <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 26, margin: 0 }}>{ministryName}</h2>
          </div>
          <p style={{ color: 'rgba(255,255,255,0.72)', lineHeight: 1.75, maxWidth: 520, marginBottom: 30 }}>
            {profile.tagline || 'A Spirit-filled congregation committed to worship, discipleship, and serving our community together, in the love of Christ.'}
          </p>
          <div style={{ display: 'flex', gap: 14 }}>
            {profile.facebookUrl && <SocialLink href={profile.facebookUrl} accent={accent}><Facebook size={18} /></SocialLink>}
            {profile.youtubeUrl && <SocialLink href={profile.youtubeUrl} accent={accent}><Youtube size={18} /></SocialLink>}
            <SocialLink href="#home" accent={accent}><Instagram size={18} /></SocialLink>
          </div>
        </div>

        <div>
          <h3 style={{ fontFamily: 'Georgia, serif', color: accent, fontSize: 22, margin: '0 0 24px' }}>Explore</h3>
          <div style={{ display: 'grid', gap: 14 }}>
            {explore.map(link => (
              <a key={link.href} href={link.href} style={{ color: 'rgba(255,255,255,0.78)', textDecoration: 'none', fontWeight: 700 }}>
                {link.label} ↗
              </a>
            ))}
          </div>
        </div>

        <div>
          <h3 style={{ fontFamily: 'Georgia, serif', color: accent, fontSize: 22, margin: '0 0 24px' }}>Contact</h3>
          <div style={{ display: 'grid', gap: 18, color: 'rgba(255,255,255,0.78)', fontWeight: 700 }}>
            {profile.email && <span style={infoRow}><Mail size={18} color={accent} /> {profile.email}</span>}
            {profile.phone && <span style={infoRow}><Phone size={18} color={accent} /> {profile.phone}</span>}
            {(profile.address) && <span style={infoRow}><MapPin size={18} color={accent} /> {profile.address}</span>}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1400, margin: '56px auto 0', borderTop: '1px solid rgba(255,255,255,0.12)', paddingTop: 28, display: 'flex', justifyContent: 'space-between', gap: 18, flexWrap: 'wrap' }}>
        <p style={{ color: 'rgba(255,255,255,0.55)', margin: 0 }}>© {year} {ministryName}. All rights reserved.</p>
        <a href="https://churchcentral.church" style={{
          color: accent,
          textDecoration: 'none',
          border: `1px solid ${accent}`,
          borderRadius: 999,
          padding: '8px 16px',
          fontSize: 12,
          fontWeight: 800,
        }}>
          • Powered by ICIMS
        </a>
      </div>
    </footer>
  );
}

function SocialLink({ href, accent, children }: { href: string; accent: string; children: React.ReactNode }) {
  return (
    <a href={href} target={href.startsWith('http') ? '_blank' : undefined} rel="noopener noreferrer" style={{
      width: 42,
      height: 42,
      borderRadius: 12,
      border: `1px solid ${accent}`,
      color: accent,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      textDecoration: 'none',
    }}>
      {children}
    </a>
  );
}

const infoRow: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 12,
};
