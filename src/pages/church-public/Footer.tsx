import { Building2, Facebook, Mail, MapPin, Phone, Youtube } from 'lucide-react';
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
  const explore = navLinks.filter(l => !['#home', '#contact'].includes(l.href)).slice(0, 5);

  return (
    <footer style={{
      background: '#121D39',
      color: '#fff',
      padding: '64px 28px 36px',
    }} className="cp-footer">
      <div style={{
        maxWidth: 1400, margin: '0 auto',
        display: 'grid',
        gridTemplateColumns: 'minmax(0,1.3fr) minmax(160px,0.6fr) minmax(240px,0.7fr)',
        gap: 64,
      }} className="cp-contact-grid">

        {/* Brand */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
            {logoSrc ? (
              <img src={logoSrc} alt="" style={{ width: 38, height: 38, borderRadius: 8, objectFit: 'cover' }} />
            ) : (
              <span style={{
                width: 38, height: 38, borderRadius: 8, background: accent,
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#121D39',
              }}>
                <Building2 size={18} />
              </span>
            )}
            <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 20, margin: 0, color: '#fff' }}>{ministryName}</h2>
          </div>
          <p style={{ color: 'rgba(255,255,255,0.55)', lineHeight: 1.75, maxWidth: 440, marginBottom: 24, fontSize: 14 }}>
            {profile.tagline || 'A Spirit-filled congregation committed to worship, discipleship, and serving our community together.'}
          </p>
          <div style={{ display: 'flex', gap: 10 }}>
            {profile.facebookUrl && (
              <SocialBtn href={profile.facebookUrl} accent={accent}><Facebook size={15} /></SocialBtn>
            )}
            {profile.youtubeUrl && (
              <SocialBtn href={profile.youtubeUrl} accent={accent}><Youtube size={15} /></SocialBtn>
            )}
          </div>
        </div>

        {/* Explore */}
        <div>
          <h3 style={{ fontFamily: 'Georgia, serif', color: accent, fontSize: 16, margin: '0 0 18px' }}>Explore</h3>
          <div style={{ display: 'grid', gap: 12 }}>
            {explore.map(link => (
              <a key={link.href} href={link.href} style={{
                color: 'rgba(255,255,255,0.65)', textDecoration: 'none',
                fontWeight: 500, fontSize: 14,
              }}>
                {link.label}
              </a>
            ))}
          </div>
        </div>

        {/* Contact */}
        <div>
          <h3 style={{ fontFamily: 'Georgia, serif', color: accent, fontSize: 16, margin: '0 0 18px' }}>Contact</h3>
          <div style={{ display: 'grid', gap: 14 }}>
            {profile.email && (
              <span style={infoRow}>
                <Mail size={15} color={accent} />
                <span style={{ color: 'rgba(255,255,255,0.65)', fontSize: 14 }}>{profile.email}</span>
              </span>
            )}
            {profile.phone && (
              <span style={infoRow}>
                <Phone size={15} color={accent} />
                <span style={{ color: 'rgba(255,255,255,0.65)', fontSize: 14 }}>{profile.phone}</span>
              </span>
            )}
            {profile.address && (
              <span style={infoRow}>
                <MapPin size={15} color={accent} />
                <span style={{ color: 'rgba(255,255,255,0.65)', fontSize: 14 }}>{profile.address}</span>
              </span>
            )}
          </div>
        </div>
      </div>

      <div style={{
        maxWidth: 1400, margin: '48px auto 0',
        borderTop: '1px solid rgba(255,255,255,0.08)',
        paddingTop: 24,
        display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap',
        alignItems: 'center',
      }}>
        <p style={{ color: 'rgba(255,255,255,0.35)', margin: 0, fontSize: 13 }}>
          © {year} {ministryName}. All rights reserved.
        </p>
        <a href="https://churchcentral.church" style={{
          color: accent, textDecoration: 'none',
          border: `1px solid ${accent}44`,
          borderRadius: 999, padding: '6px 14px',
          fontSize: 11, fontWeight: 700,
        }}>
          Powered by ICIMS
        </a>
      </div>
    </footer>
  );
}

function SocialBtn({ href, accent, children }: { href: string; accent: string; children: React.ReactNode }) {
  return (
    <a href={href} target={href.startsWith('http') ? '_blank' : undefined} rel="noopener noreferrer" style={{
      width: 34, height: 34, borderRadius: 8,
      border: `1px solid rgba(255,255,255,0.15)`,
      color: 'rgba(255,255,255,0.65)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      textDecoration: 'none',
    }}>
      {children}
    </a>
  );
}

const infoRow: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'flex-start', gap: 10,
};
