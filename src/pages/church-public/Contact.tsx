import { useState } from 'react';
import type { Profile, PublicChurch } from './types';

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
  churches: PublicChurch[];
}

function getMapSrc(church: PublicChurch | null, fallbackAddress?: string): string {
  if (church?.latitude && church?.longitude) {
    return `https://www.google.com/maps?q=${church.latitude},${church.longitude}&output=embed`;
  }
  const q = church?.address || fallbackAddress;
  if (q) return `https://www.google.com/maps?q=${encodeURIComponent(q)}&output=embed`;
  return '';
}

function getGoogleMapsUrl(church: PublicChurch | null, fallbackAddress?: string): string {
  if (church?.latitude && church?.longitude) {
    return `https://www.google.com/maps?q=${church.latitude},${church.longitude}`;
  }
  const q = church?.address || fallbackAddress;
  if (q) return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
  return 'https://maps.google.com';
}

export function Contact({ profile, accent, churches }: ContactProps) {
  const defaultChurch = churches.find(c => c.latitude || c.address) ?? churches[0] ?? null;
  const [selectedChurch, setSelectedChurch] = useState<PublicChurch | null>(defaultChurch);

  const mapSrc = getMapSrc(selectedChurch, profile.address);
  const mapsUrl = getGoogleMapsUrl(selectedChurch, profile.address);
  const showMap = !!mapSrc;
  const showChurchList = churches.length > 1;

  return (
    <section id="contact" style={{ background: '#fff', padding: '80px 28px 100px' }}>
      <div style={{ maxWidth: 1400, margin: '0 auto' }}>

        <p style={{
          fontSize: 11, fontWeight: 700, letterSpacing: '0.22em',
          textTransform: 'uppercase', color: accent, marginBottom: 12,
        }}>Get in Touch</p>

        <h2 className="cp-section-title" style={{
          fontFamily: 'Georgia, "Times New Roman", serif',
          fontSize: 'clamp(2rem, 4.5vw, 3.2rem)',
          fontWeight: 800, color: '#0f172a', lineHeight: 1.1, marginBottom: 12,
        }}>We'd love to hear from you.</h2>

        <p style={{
          fontSize: 15, color: '#64748b', lineHeight: 1.7,
          marginBottom: 52, maxWidth: 480,
        }}>
          Reach out anytime — whether you're planning a visit, looking for prayer, or want to learn more about our community.
        </p>

        <div className="cp-contact-grid" style={{
          display: 'grid',
          gridTemplateColumns: showMap ? '1fr 1fr' : '1fr',
          gap: 56, alignItems: 'start',
        }}>
          {/* Left */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

            {profile.phone && (
              <a href={`tel:${profile.phone}`} style={{ textDecoration: 'none' }}>
                <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#94a3b8', marginBottom: 4 }}>Phone</p>
                <p style={{ fontSize: 16, color: '#0f172a', fontWeight: 600, margin: 0 }}>{profile.phone}</p>
              </a>
            )}

            {profile.email && (
              <a href={`mailto:${profile.email}`} style={{ textDecoration: 'none' }}>
                <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#94a3b8', marginBottom: 4 }}>Email</p>
                <p style={{ fontSize: 16, color: '#0f172a', fontWeight: 600, margin: 0 }}>{profile.email}</p>
              </a>
            )}

            {/* Church list */}
            {showChurchList && (
              <div>
                <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#94a3b8', marginBottom: 12 }}>
                  Our Locations
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2, maxHeight: 260, overflowY: 'auto' }}>
                  {churches.map(c => {
                    const isSelected = selectedChurch?.id === c.id;
                    return (
                      <button
                        key={c.id}
                        onClick={() => setSelectedChurch(c)}
                        style={{
                          background: isSelected ? '#f1f5f9' : 'transparent',
                          border: 'none', cursor: 'pointer',
                          padding: '10px 14px', textAlign: 'left',
                          borderLeft: `2px solid ${isSelected ? accent : '#e2e8f0'}`,
                          borderRadius: '0 6px 6px 0',
                          transition: 'background 0.15s, border-color 0.15s',
                        }}
                      >
                        <p style={{ fontSize: 14, fontWeight: 600, color: isSelected ? '#0f172a' : '#475569', marginBottom: 2 }}>
                          {c.name}
                        </p>
                        {c.address && (
                          <p style={{ fontSize: 12, color: '#94a3b8', margin: 0 }}>{c.address}</p>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Single address */}
            {!showChurchList && (selectedChurch?.address || profile.address) && (
              <div>
                <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#94a3b8', marginBottom: 4 }}>Address</p>
                <p style={{ fontSize: 16, color: '#0f172a', fontWeight: 600, margin: 0 }}>
                  {selectedChurch?.address || profile.address}
                </p>
              </div>
            )}

            {/* Social */}
            {(profile.facebookUrl || profile.youtubeUrl || profile.whatsappNumber) && (
              <div style={{ display: 'flex', gap: 10, paddingTop: 4 }}>
                {profile.facebookUrl && (
                  <a href={profile.facebookUrl} target="_blank" rel="noopener noreferrer" style={{
                    width: 36, height: 36, borderRadius: 8, border: '1px solid #e2e8f0',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#64748b', textDecoration: 'none',
                  }}><IconFacebook /></a>
                )}
                {profile.youtubeUrl && (
                  <a href={profile.youtubeUrl} target="_blank" rel="noopener noreferrer" style={{
                    width: 36, height: 36, borderRadius: 8, border: '1px solid #e2e8f0',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#64748b', textDecoration: 'none',
                  }}><IconYoutube /></a>
                )}
                {profile.whatsappNumber && (
                  <a href={`https://wa.me/${profile.whatsappNumber.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" style={{
                    width: 36, height: 36, borderRadius: 8, border: '1px solid #e2e8f0',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#64748b', textDecoration: 'none',
                  }}><IconWhatsApp /></a>
                )}
              </div>
            )}
          </div>

          {/* Right — map */}
          {showMap && (
            <div>
              <div className="cp-map" style={{
                height: 320, borderRadius: 12, overflow: 'hidden',
                border: '1px solid #e2e8f0', marginBottom: 10,
              }}>
                <iframe
                  key={mapSrc}
                  title="Church location"
                  width="100%" height="100%"
                  style={{ border: 0 }}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  src={mapSrc}
                />
              </div>
              <a
                href={mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  fontSize: 12, fontWeight: 600, color: accent,
                  textDecoration: 'none',
                }}
              >
                Open in Google Maps ↗
              </a>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
