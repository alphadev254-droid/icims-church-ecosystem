import { Phone, Mail, MapPin, MessageCircle } from 'lucide-react';
import type { Profile } from './types';

// SVG social icons (lucide Facebook/Youtube are deprecated)
const IconFacebook = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
  </svg>
);
const IconYoutube = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
    <path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46A2.78 2.78 0 0 0 1.46 6.42 29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58 2.78 2.78 0 0 0 1.95 1.95C5.12 20 12 20 12 20s6.88 0 8.59-.47a2.78 2.78 0 0 0 1.95-1.95A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58zM9.75 15.02V8.98L15.5 12z" />
  </svg>
);

interface ContactProps {
  profile: Profile;
  accent: string;
}

function SocialBtn({ href, title, children, accent }: { href: string; title: string; children: React.ReactNode; accent: string }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" title={title}
      style={{
        width: 44, height: 44, borderRadius: 12,
        background: '#f3f0eb', display: 'flex',
        alignItems: 'center', justifyContent: 'center',
        color: '#374151', textDecoration: 'none',
        transition: 'background 0.15s, color 0.15s',
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLAnchorElement).style.background = accent;
        (e.currentTarget as HTMLAnchorElement).style.color = '#fff';
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLAnchorElement).style.background = '#f3f0eb';
        (e.currentTarget as HTMLAnchorElement).style.color = '#374151';
      }}
    >
      {children}
    </a>
  );
}

function ContactRow({ href, icon, label, value, accent }: {
  href?: string; icon: React.ReactNode; label: string; value: string; accent: string;
}) {
  const inner = (
    <>
      <div style={{
        width: 44, height: 44, borderRadius: 12,
        background: `${accent}18`, flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {icon}
      </div>
      <div>
        <p style={{ fontSize: 11, color: '#9ca3af', marginBottom: 2, fontWeight: 600 }}>{label}</p>
        <p style={{ fontWeight: 700, fontSize: 15 }}>{value}</p>
      </div>
    </>
  );

  const rowStyle: React.CSSProperties = {
    display: 'flex', alignItems: 'center', gap: 16,
    padding: '16px 20px', borderRadius: 12,
    border: '1px solid #f3f0eb',
    transition: 'background 0.15s',
    color: '#374151',
  };

  if (href) {
    return (
      <a href={href} style={{ ...rowStyle, textDecoration: 'none' }}
        onMouseEnter={e => (e.currentTarget as HTMLAnchorElement).style.background = '#fafaf9'}
        onMouseLeave={e => (e.currentTarget as HTMLAnchorElement).style.background = 'transparent'}
      >
        {inner}
      </a>
    );
  }
  return <div style={rowStyle}>{inner}</div>;
}

export function Contact({ profile, accent }: ContactProps) {
  return (
    <section id="contact" style={{ background: '#fff', padding: '80px 24px' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <p style={{ color: accent, fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 8 }}>
          Get in Touch
        </p>
        <h2 style={{ fontSize: 'clamp(1.6rem, 3vw, 2.4rem)', fontWeight: 800, color: '#111', marginBottom: 48 }}>
          Contact Us
        </h2>

        <div style={{
          display: 'grid',
          gridTemplateColumns: profile.address ? '1fr 1fr' : '1fr',
          gap: 48, alignItems: 'start',
        }}>
          {/* Left: contact rows */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {profile.phone && (
              <ContactRow href={`tel:${profile.phone}`} label="Phone" value={profile.phone} accent={accent}
                icon={<Phone size={20} color={accent} />} />
            )}
            {profile.email && (
              <ContactRow href={`mailto:${profile.email}`} label="Email" value={profile.email} accent={accent}
                icon={<Mail size={20} color={accent} />} />
            )}
            {profile.address && (
              <ContactRow label="Address" value={profile.address} accent={accent}
                icon={<MapPin size={20} color={accent} />} />
            )}

            {/* Social */}
            {(profile.facebookUrl || profile.youtubeUrl || profile.whatsappNumber) && (
              <div style={{ display: 'flex', gap: 10, paddingTop: 4 }}>
                {profile.facebookUrl && (
                  <SocialBtn href={profile.facebookUrl} title="Facebook" accent={accent}>
                    <IconFacebook />
                  </SocialBtn>
                )}
                {profile.youtubeUrl && (
                  <SocialBtn href={profile.youtubeUrl} title="YouTube" accent={accent}>
                    <IconYoutube />
                  </SocialBtn>
                )}
                {profile.whatsappNumber && (
                  <SocialBtn href={`https://wa.me/${profile.whatsappNumber.replace(/\D/g, '')}`} title="WhatsApp" accent={accent}>
                    <MessageCircle size={20} />
                  </SocialBtn>
                )}
              </div>
            )}
          </div>

          {/* Right: map */}
          {profile.address && (
            <div style={{
              borderRadius: 16, overflow: 'hidden',
              border: '1px solid #ede9e3', height: 340,
              boxShadow: '0 4px 16px rgba(0,0,0,0.07)',
            }}>
              <iframe
                title="Church location"
                width="100%" height="100%"
                style={{ border: 0 }}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                src={`https://www.google.com/maps?q=${encodeURIComponent(profile.address)}&output=embed`}
              />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
