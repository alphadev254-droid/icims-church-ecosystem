import type { NavLink, Profile } from './types';

interface FooterProps {
  ministryName: string;
  logoSrc: string | null;
  profile: Profile;
  accent: string;
  navLinks: NavLink[];
}

export function Footer({ ministryName, profile }: FooterProps) {
  const year = new Date().getFullYear();

  return (
    <footer style={{
      background: '#111822',
      borderTop: '1px solid rgba(255,255,255,0.08)',
      padding: '32px 40px',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      flexWrap: 'wrap', gap: 12,
    }}>
      <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.05em' }}>
        © {year} {ministryName}{profile.address ? `, ${profile.address.split(',').pop()?.trim()}` : ''}.
      </p>
      <p style={{
        fontFamily: 'Georgia, serif',
        fontSize: 11, color: 'rgba(255,255,255,0.25)',
        letterSpacing: '0.15em', textTransform: 'uppercase',
        fontStyle: 'italic',
      }}>
        "For where two or three gather in my name, there am I." — Matt. 18:20
      </p>
      <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', letterSpacing: '0.05em' }}>
        Powered by{' '}
        <a href="https://churchcentral.church" style={{ color: 'rgba(255,255,255,0.4)', textDecoration: 'none' }}>
          ICIMS
        </a>
      </p>
    </footer>
  );
}
