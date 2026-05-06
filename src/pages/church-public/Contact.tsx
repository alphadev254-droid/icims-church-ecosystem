import type { Profile } from './types';

// SVG social icons
const IconFacebook = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
  </svg>
);
const IconYoutube = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
    <path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46A2.78 2.78 0 0 0 1.46 6.42 29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58 2.78 2.78 0 0 0 1.95 1.95C5.12 20 12 20 12 20s6.88 0 8.59-.47a2.78 2.78 0 0 0 1.95-1.95A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58zM9.75 15.02V8.98L15.5 12z" />
  </svg>
);
const IconWhatsApp = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
  </svg>
);

interface ContactProps {
  profile: Profile;
  accent: string;
}

export function Contact({ profile, accent }: ContactProps) {
  const mapsUrl = profile.address
    ? `https://maps.google.com/?q=${encodeURIComponent(profile.address)}`
    : null;

  return (
    <section id="contact" style={{ background: '#fff', padding: '100px 40px' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>

        <p style={{
          fontSize: 10, fontWeight: 600, letterSpacing: '0.22em',
          textTransform: 'uppercase', color: '#888', marginBottom: 20,
        }}>Get in Touch</p>

        <h2 style={{
          fontFamily: 'Georgia, "Times New Roman", serif',
          fontSize: 'clamp(2rem, 4vw, 3rem)',
          fontWeight: 400, color: '#0a0a0a',
          lineHeight: 1.15, letterSpacing: '-0.01em',
          marginBottom: 16,
        }}>We'd love to hear from you.</h2>

        <p style={{
          fontSize: 14, color: '#888', lineHeight: 1.7,
          marginBottom: 64, maxWidth: 480,
        }}>
          Reach out anytime — whether you're planning a visit, looking for prayer, or want to learn more about our community.
        </p>

        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 80, alignItems: 'start',
        }}>
          {/* Left: contact details */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
            {profile.phone && (
              <a href={`tel:${profile.phone}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                <p style={{
                  fontSize: 10, fontWeight: 600, letterSpacing: '0.2em',
                  textTransform: 'uppercase', color: '#888', marginBottom: 6,
                }}>Phone</p>
                <p style={{ fontSize: 16, color: '#0a0a0a', fontWeight: 500 }}>{profile.phone}</p>
              </a>
            )}

            {profile.email && (
              <a href={`mailto:${profile.email}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                <p style={{
                  fontSize: 10, fontWeight: 600, letterSpacing: '0.2em',
                  textTransform: 'uppercase', color: '#888', marginBottom: 6,
                }}>Email</p>
                <p style={{ fontSize: 16, color: '#0a0a0a', fontWeight: 500 }}>{profile.email}</p>
              </a>
            )}

            {profile.address && (
              <div>
                <p style={{
                  fontSize: 10, fontWeight: 600, letterSpacing: '0.2em',
                  textTransform: 'uppercase', color: '#888', marginBottom: 6,
                }}>Address</p>
                <p style={{ fontSize: 16, color: '#0a0a0a', fontWeight: 500, marginBottom: 8 }}>
                  {profile.address}
                </p>
                {mapsUrl && (
                  <a href={mapsUrl} target="_blank" rel="noopener noreferrer" style={{
                    fontSize: 12, fontWeight: 600, letterSpacing: '0.1em',
                    textTransform: 'uppercase', color: '#0a0a0a',
                    textDecoration: 'none',
                    borderBottom: '1px solid #0a0a0a',
                    paddingBottom: 2,
                    transition: 'opacity 0.2s',
                  }}
                  onMouseEnter={e => (e.currentTarget as HTMLAnchorElement).style.opacity = '0.5'}
                  onMouseLeave={e => (e.currentTarget as HTMLAnchorElement).style.opacity = '1'}
                  >
                    Get directions →
                  </a>
                )}
              </div>
            )}

            {/* Social */}
            {(profile.facebookUrl || profile.youtubeUrl || profile.whatsappNumber) && (
              <div style={{ display: 'flex', gap: 16, paddingTop: 8 }}>
                {profile.facebookUrl && (
                  <a href={profile.facebookUrl} target="_blank" rel="noopener noreferrer"
                    style={{ color: '#555', textDecoration: 'none', transition: 'color 0.2s' }}
                    onMouseEnter={e => (e.currentTarget as HTMLAnchorElement).style.color = '#0a0a0a'}
                    onMouseLeave={e => (e.currentTarget as HTMLAnchorElement).style.color = '#555'}
                    title="Facebook"
                  >
                    <IconFacebook />
                  </a>
                )}
                {profile.youtubeUrl && (
                  <a href={profile.youtubeUrl} target="_blank" rel="noopener noreferrer"
                    style={{ color: '#555', textDecoration: 'none', transition: 'color 0.2s' }}
                    onMouseEnter={e => (e.currentTarget as HTMLAnchorElement).style.color = '#0a0a0a'}
                    onMouseLeave={e => (e.currentTarget as HTMLAnchorElement).style.color = '#555'}
                    title="YouTube"
                  >
                    <IconYoutube />
                  </a>
                )}
                {profile.whatsappNumber && (
                  <a href={`https://wa.me/${profile.whatsappNumber.replace(/\D/g, '')}`}
                    target="_blank" rel="noopener noreferrer"
                    style={{ color: '#555', textDecoration: 'none', transition: 'color 0.2s' }}
                    onMouseEnter={e => (e.currentTarget as HTMLAnchorElement).style.color = '#0a0a0a'}
                    onMouseLeave={e => (e.currentTarget as HTMLAnchorElement).style.color = '#555'}
                    title="WhatsApp"
                  >
                    <IconWhatsApp />
                  </a>
                )}
              </div>
            )}
          </div>

          {/* Right: map embed */}
          {profile.address && (
            <div style={{ height: 360, background: '#f0ece6', overflow: 'hidden' }}>
              <iframe
                title="Church location"
                width="100%" height="100%"
                style={{ border: 0, filter: 'grayscale(30%)' }}
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
