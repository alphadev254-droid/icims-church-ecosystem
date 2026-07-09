import type { Profile } from './types';
import type React from 'react';

interface AboutProps {
  profile: Profile;
  pastorSrc: string | null;
  accent: string;
}

export function About({ profile, pastorSrc, accent }: AboutProps) {
  return (
    <section id="about" className="cp-section" style={{ background: '#faf9f7', padding: '78px 28px' }}>
      <div style={{ maxWidth: 1400, margin: '0 auto' }}>
        <p style={{
          fontSize: 11,
          fontWeight: 800,
          letterSpacing: '0.22em',
          textTransform: 'uppercase',
          color: accent,
          marginBottom: 16,
        }}>
          About Us
        </p>

        <div className="cp-two-col" style={{
          display: 'grid',
          gridTemplateColumns: profile.pastorName ? 'minmax(0, 1.05fr) minmax(320px, 0.95fr)' : '1fr',
          gap: 54,
          alignItems: 'start',
        }}>
          <div>
            <h2 className="cp-section-title" style={{
              fontFamily: 'Georgia, "Times New Roman", serif',
              fontSize: 'clamp(2.2rem, 5vw, 3.7rem)',
              fontWeight: 800,
              color: '#101a30',
              lineHeight: 1.08,
              marginBottom: 24,
            }}>
              Who we are.
            </h2>

            {profile.aboutText && (
              <p style={{
                fontSize: 16,
                lineHeight: 1.75,
                color: '#53617a',
                marginBottom: 30,
                whiteSpace: 'pre-wrap',
              }}>
                {profile.aboutText}
              </p>
            )}

            {(profile.visionText || profile.missionText) && (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
                gap: 18,
              }}>
                {profile.visionText && (
                  <div style={infoCardStyle}>
                    <p style={smallLabelStyle(accent)}>Vision</p>
                    <p style={infoCopyStyle}>{profile.visionText}</p>
                  </div>
                )}
                {profile.missionText && (
                  <div style={infoCardStyle}>
                    <p style={smallLabelStyle(accent)}>Mission</p>
                    <p style={infoCopyStyle}>{profile.missionText}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {profile.pastorName && (
            <div style={{
              background: '#fff',
              border: '1px solid #e9dfd2',
              borderRadius: 18,
              padding: 18,
              boxShadow: '0 16px 42px rgba(16,24,40,0.05)',
            }}>
              {pastorSrc ? (
                <img src={pastorSrc} alt={profile.pastorName} style={{
                  width: '100%',
                  maxHeight: 390,
                  objectFit: 'cover',
                  display: 'block',
                  marginBottom: 22,
                  borderRadius: 14,
                  filter: 'grayscale(12%)',
                }} />
              ) : (
                <div style={{
                  width: '100%',
                  height: 280,
                  background: `linear-gradient(135deg, ${accent}, #f4ead7)`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 22,
                  fontSize: 48,
                  color: '#101a30',
                  borderRadius: 14,
                  fontFamily: 'Georgia, serif',
                }}>
                  +
                </div>
              )}
              <p style={smallLabelStyle(accent)}>Lead Pastor</p>
              <h3 style={{
                fontFamily: 'Georgia, serif',
                fontSize: 24,
                fontWeight: 800,
                color: '#101a30',
                margin: '0 0 12px',
              }}>
                {profile.pastorName}
              </h3>
              {profile.pastorBio && (
                <p style={{ fontSize: 14, color: '#53617a', lineHeight: 1.75, margin: 0 }}>
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

const infoCardStyle: React.CSSProperties = {
  background: '#fff',
  border: '1px solid #e9dfd2',
  borderRadius: 16,
  padding: 22,
};

function smallLabelStyle(accent: string): React.CSSProperties {
  return {
    fontSize: 11,
    fontWeight: 800,
    letterSpacing: '0.18em',
    textTransform: 'uppercase',
    color: accent,
    margin: '0 0 10px',
  };
}

const infoCopyStyle: React.CSSProperties = {
  fontSize: 15,
  color: '#53617a',
  lineHeight: 1.7,
  margin: 0,
};
