import type { Profile } from './types';

interface AboutProps {
  profile: Profile;
  pastorSrc: string | null;
  accent: string;
}

export function About({ profile, pastorSrc, accent }: AboutProps) {
  return (
    <section id="about" style={{ background: '#fff', padding: '80px 24px' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <p style={{ color: accent, fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 8 }}>
          About Us
        </p>
        <h2 style={{ fontSize: 'clamp(1.6rem, 3vw, 2.4rem)', fontWeight: 800, color: '#111', marginBottom: 48 }}>
          Who We Are
        </h2>

        <div style={{
          display: 'grid',
          gridTemplateColumns: profile.pastorName ? 'minmax(0,1.4fr) minmax(0,1fr)' : '1fr',
          gap: 56, alignItems: 'start',
        }}>
          {/* Left: text + vision/mission */}
          <div>
            {profile.aboutText && (
              <p style={{ fontSize: 17, lineHeight: 1.8, color: '#374151', marginBottom: 36, whiteSpace: 'pre-wrap' }}>
                {profile.aboutText}
              </p>
            )}
            {(profile.visionText || profile.missionText) && (
              <div style={{
                display: 'grid',
                gridTemplateColumns: profile.visionText && profile.missionText ? '1fr 1fr' : '1fr',
                gap: 16,
              }}>
                {profile.visionText && (
                  <div style={{ background: '#fafaf9', borderLeft: `4px solid ${accent}`, padding: '20px 22px', borderRadius: '0 10px 10px 0' }}>
                    <p style={{ fontSize: 11, fontWeight: 700, color: accent, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>Vision</p>
                    <p style={{ fontSize: 14, color: '#374151', lineHeight: 1.7 }}>{profile.visionText}</p>
                  </div>
                )}
                {profile.missionText && (
                  <div style={{ background: '#fafaf9', borderLeft: `4px solid ${accent}`, padding: '20px 22px', borderRadius: '0 10px 10px 0' }}>
                    <p style={{ fontSize: 11, fontWeight: 700, color: accent, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>Mission</p>
                    <p style={{ fontSize: 14, color: '#374151', lineHeight: 1.7 }}>{profile.missionText}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right: pastor card */}
          {profile.pastorName && (
            <div style={{
              background: '#fafaf9', borderRadius: 20, padding: '36px 28px',
              textAlign: 'center', border: `1px solid ${accent}22`,
              boxShadow: `0 4px 24px ${accent}11`,
            }}>
              {pastorSrc ? (
                <img src={pastorSrc} alt={profile.pastorName} style={{
                  width: 120, height: 120, borderRadius: '50%', objectFit: 'cover',
                  display: 'block', margin: '0 auto 20px',
                  border: `4px solid ${accent}`, boxShadow: `0 4px 16px ${accent}44`,
                }} />
              ) : (
                <div style={{
                  width: 120, height: 120, borderRadius: '50%',
                  background: `${accent}22`, border: `4px solid ${accent}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 20px', fontSize: 44,
                }}>👤</div>
              )}
              <p style={{ fontWeight: 800, fontSize: 20, color: '#111', marginBottom: 4 }}>{profile.pastorName}</p>
              <p style={{ fontSize: 11, color: accent, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 16 }}>
                Lead Pastor
              </p>
              {profile.pastorBio && (
                <p style={{ fontSize: 14, color: '#6b7280', lineHeight: 1.75 }}>{profile.pastorBio}</p>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
