import { Phone, Mail, MapPin } from 'lucide-react';
import type { NavLink, Profile } from './types';

interface FooterProps {
  ministryName: string;
  logoSrc: string | null;
  profile: Profile;
  accent: string;
  navLinks: NavLink[];
}

export function Footer({ ministryName, logoSrc, profile, accent, navLinks }: FooterProps) {
  return (
    <footer style={{ background: '#111', color: '#9ca3af', padding: '60px 24px 0' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 40, paddingBottom: 48,
        }}>
          {/* Church name + tagline */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              {logoSrc && (
                <img src={logoSrc} alt={ministryName} style={{
                  width: 36, height: 36, borderRadius: '50%', objectFit: 'cover',
                  border: `2px solid ${accent}55`,
                }} />
              )}
              <span style={{ color: '#fff', fontWeight: 800, fontSize: 16 }}>{ministryName}</span>
            </div>
            {profile.tagline && (
              <p style={{ fontSize: 13, lineHeight: 1.7, color: '#6b7280', maxWidth: 220 }}>
                {profile.tagline}
              </p>
            )}
          </div>

          {/* Quick links */}
          <div>
            <p style={{ color: '#fff', fontWeight: 700, fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 16 }}>
              Quick Links
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {navLinks.map(link => (
                <a key={link.href} href={link.href} style={{ color: '#9ca3af', fontSize: 14, textDecoration: 'none', transition: 'color 0.15s' }}
                  onMouseEnter={e => (e.currentTarget as HTMLAnchorElement).style.color = accent}
                  onMouseLeave={e => (e.currentTarget as HTMLAnchorElement).style.color = '#9ca3af'}
                >{link.label}</a>
              ))}
            </div>
          </div>

          {/* Contact */}
          <div>
            <p style={{ color: '#fff', fontWeight: 700, fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 16 }}>
              Contact
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {profile.phone && (
                <a href={`tel:${profile.phone}`} style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#9ca3af', fontSize: 13, textDecoration: 'none' }}>
                  <Phone size={14} color={accent} /> {profile.phone}
                </a>
              )}
              {profile.email && (
                <a href={`mailto:${profile.email}`} style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#9ca3af', fontSize: 13, textDecoration: 'none' }}>
                  <Mail size={14} color={accent} /> {profile.email}
                </a>
              )}
              {profile.address && (
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, color: '#9ca3af', fontSize: 13 }}>
                  <MapPin size={14} color={accent} style={{ flexShrink: 0, marginTop: 2 }} />
                  {profile.address}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div style={{ borderTop: '1px solid #222', padding: '20px 24px', textAlign: 'center' }}>
        <p style={{ fontSize: 13, color: '#4b5563' }}>
          Powered by{' '}
          <a href="https://churchcentral.church" style={{ color: accent, textDecoration: 'none', fontWeight: 600 }}>
            ICIMS — Church Central
          </a>
        </p>
      </div>
    </footer>
  );
}
