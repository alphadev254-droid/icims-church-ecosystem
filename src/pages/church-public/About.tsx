import type { Profile } from './types';

interface AboutProps {
  profile: Profile;
  pastorSrc: string | null;
  accent: string;
}

export function About({ profile, pastorSrc, accent }: AboutProps) {
  return (
    <section id="about" style={{ background: '#faf9f7', padding: '100px 40px' }}>
      <div style={{ maxWidth: 1400, margin: '0 auto' }}>

        {/* Section label */}
        <p style={{
          fontFamily: 'Georgia, serif',
          fontSize: 10, fontWeight: 400, letterSpacing: '0.22em',
          textTransform: 'uppercase', color: '#888',
          marginBottom: 20,
        }}>About Us</p>

        <div style={{
          display: 'grid',
          gridTemplateColumns: profile.pastorName ? '1fr 1fr' : '1fr',
          gap: 80, alignItems: 'start',
        }}>
          {/* Left: text */}
          <div>
            <h2 style={{
              fontFamily: 'Georgia, "Times New Roman", serif',
              fontSize: 'clamp(2rem, 4vw, 3rem)',
              fontWeight: 400, color: '#0a0a0a',
              lineHeight: 1.15, marginBottom: 32,
              letterSpacing: '-0.01em',
            }}>Who we are.</h2>

            {profile.aboutText && (
              <p style={{
                fontSize: 16, lineHeight: 1.85, color: '#444',
                marginBottom: 36, whiteSpace: 'pre-wrap',
              }}>
                {profile.aboutText}
              </p>
            )}

            {/* Vision / Mission */}
            {(profile.visionText || profile.missionText) && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {profile.visionText && (
                  <div>
                    <p style={{
                      fontSize: 10, fontWeight: 600, letterSpacing: '0.2em',
                      textTransform: 'uppercase', color: '#888', marginBottom: 8,
                    }}>Vision</p>
                    <p style={{ fontSize: 15, color: '#333', lineHeight: 1.7 }}>{profile.visionText}</p>
                  </div>
                )}
                {profile.missionText && (
                  <div>
                    <p style={{
                      fontSize: 10, fontWeight: 600, letterSpacing: '0.2em',
                      textTransform: 'uppercase', color: '#888', marginBottom: 8,
                    }}>Mission</p>
                    <p style={{ fontSize: 15, color: '#333', lineHeight: 1.7 }}>{profile.missionText}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right: pastor */}
          {profile.pastorName && (
            <div>
              {pastorSrc ? (
                <img src={pastorSrc} alt={profile.pastorName} style={{
                  width: '100%', maxHeight: 420, objectFit: 'cover',
                  display: 'block', marginBottom: 24,
                  filter: 'grayscale(15%)',
                }} />
              ) : (
                <div style={{
                  width: '100%', height: 320,
                  background: '#e8e4de',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginBottom: 24, fontSize: 48, color: '#bbb',
                }}>✝</div>
              )}
              <p style={{
                fontSize: 10, fontWeight: 600, letterSpacing: '0.2em',
                textTransform: 'uppercase', color: '#888', marginBottom: 6,
              }}>Lead Pastor</p>
              <h3 style={{
                fontFamily: 'Georgia, serif',
                fontSize: 22, fontWeight: 400, color: '#0a0a0a',
                marginBottom: 12,
              }}>{profile.pastorName}</h3>
              {profile.pastorBio && (
                <p style={{ fontSize: 14, color: '#555', lineHeight: 1.75 }}>
                  {profile.pastorBio}
                </p>
              )}
              {profile.visionText && (
                <p style={{
                  fontFamily: 'Georgia, serif',
                  fontSize: 14, fontStyle: 'italic', color: '#888',
                  marginTop: 20, borderTop: '1px solid #e0dbd4',
                  paddingTop: 16,
                }}>
                  "{profile.visionText}"
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
