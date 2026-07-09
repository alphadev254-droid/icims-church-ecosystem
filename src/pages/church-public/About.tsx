import type { Profile } from './types';

interface AboutProps {
  profile: Profile;
  pastorSrc: string | null;
  accent: string;
}

export function About({ profile, pastorSrc, accent }: AboutProps) {
  return (
    <section id="about" style={{ background: '#fff', padding: '80px 28px' }}>
      <div style={{ maxWidth: 1400, margin: '0 auto' }}>

        <p style={{
          fontSize: 11, fontWeight: 700, letterSpacing: '0.22em',
          textTransform: 'uppercase', color: accent, marginBottom: 12,
        }}>About Us</p>

        <div className="cp-two-col" style={{
          display: 'grid',
          gridTemplateColumns: profile.pastorName ? 'minmax(0,1.1fr) minmax(300px,0.9fr)' : '1fr',
          gap: 56, alignItems: 'start',
        }}>
          <div>
            <h2 className="cp-section-title" style={{
              fontFamily: 'Georgia, "Times New Roman", serif',
              fontSize: 'clamp(2rem, 4.5vw, 3.2rem)',
              fontWeight: 800, color: '#0f172a', lineHeight: 1.1, marginBottom: 20,
            }}>
              Who we are.
            </h2>

            {profile.aboutText && (
              <p style={{
                fontSize: 16, lineHeight: 1.8, color: '#475569',
                marginBottom: 28, whiteSpace: 'pre-wrap',
              }}>
                {profile.aboutText}
              </p>
            )}

            {(profile.visionText || profile.missionText) && (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px,1fr))',
                gap: 16,
              }}>
                {profile.visionText && (
                  <div style={{
                    background: '#f8f9fb', border: '1px solid #e2e8f0',
                    borderRadius: 12, padding: 20,
                  }}>
                    <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: accent, margin: '0 0 8px' }}>Vision</p>
                    <p style={{ fontSize: 14, color: '#475569', lineHeight: 1.7, margin: 0 }}>{profile.visionText}</p>
                  </div>
                )}
                {profile.missionText && (
                  <div style={{
                    background: '#f8f9fb', border: '1px solid #e2e8f0',
                    borderRadius: 12, padding: 20,
                  }}>
                    <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: accent, margin: '0 0 8px' }}>Mission</p>
                    <p style={{ fontSize: 14, color: '#475569', lineHeight: 1.7, margin: 0 }}>{profile.missionText}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {profile.pastorName && (
            <div style={{
              background: '#f8f9fb', border: '1px solid #e2e8f0',
              borderRadius: 14, padding: 16,
              boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
            }}>
              {pastorSrc ? (
                <img src={pastorSrc} alt={profile.pastorName} style={{
                  width: '100%', maxHeight: 360, objectFit: 'cover',
                  display: 'block', marginBottom: 18, borderRadius: 10,
                }} />
              ) : (
                <div style={{
                  width: '100%', height: 240,
                  background: `linear-gradient(135deg, ${accent}22, ${accent}44)`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginBottom: 18, fontSize: 52, color: accent,
                  borderRadius: 10, fontFamily: 'Georgia, serif',
                }}>
                  {profile.pastorName.charAt(0)}
                </div>
              )}
              <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: accent, margin: '0 0 6px' }}>Lead Pastor</p>
              <h3 style={{
                fontFamily: 'Georgia, serif', fontSize: 22, fontWeight: 700,
                color: '#0f172a', margin: '0 0 10px',
              }}>
                {profile.pastorName}
              </h3>
              {profile.pastorBio && (
                <p style={{ fontSize: 14, color: '#64748b', lineHeight: 1.75, margin: 0 }}>
                  {profile.pastorBio}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
