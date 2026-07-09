import type { Profile } from './types';

interface AboutProps {
  profile: Profile;
  pastorSrc: string | null;
  accent: string;
}

export function About({ profile, pastorSrc, accent }: AboutProps) {
  return (
    <section id="about" style={{ background: '#f8fafc', padding: '56px 28px' }}>
      <div style={{ maxWidth: 1400, margin: '0 auto' }}>
        <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', color: accent, marginBottom: 8 }}>About Us</p>

        <div className="cp-two-col" style={{
          display: 'grid',
          gridTemplateColumns: profile.pastorName ? 'minmax(0,1.15fr) minmax(280px,0.85fr)' : '1fr',
          gap: 48, alignItems: 'start',
        }}>
          <div>
            <h2 className="cp-section-title" style={{
              fontFamily: 'Georgia, "Times New Roman", serif',
              fontSize: 'clamp(1.8rem, 3.8vw, 2.8rem)',
              fontWeight: 800, color: '#0a0f1e', lineHeight: 1.1, marginBottom: 16,
            }}>
              Who we are.
            </h2>

            {profile.aboutText && (
              <p style={{ fontSize: 15, lineHeight: 1.8, color: '#475569', marginBottom: 24, whiteSpace: 'pre-wrap' }}>
                {profile.aboutText}
              </p>
            )}

            {(profile.visionText || profile.missionText) && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px,1fr))', gap: 12 }}>
                {profile.visionText && (
                  <div style={{
                    background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, padding: '16px 18px',
                    borderTop: `3px solid ${accent}`,
                  }}>
                    <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: accent, margin: '0 0 6px' }}>Vision</p>
                    <p style={{ fontSize: 13, color: '#475569', lineHeight: 1.7, margin: 0 }}>{profile.visionText}</p>
                  </div>
                )}
                {profile.missionText && (
                  <div style={{
                    background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, padding: '16px 18px',
                    borderTop: `3px solid ${accent}`,
                  }}>
                    <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: accent, margin: '0 0 6px' }}>Mission</p>
                    <p style={{ fontSize: 13, color: '#475569', lineHeight: 1.7, margin: 0 }}>{profile.missionText}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {profile.pastorName && (
            <div style={{
              background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, overflow: 'hidden',
              boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
            }}>
              {pastorSrc ? (
                <img src={pastorSrc} alt={profile.pastorName} style={{
                  width: '100%', height: 280, objectFit: 'cover', display: 'block',
                }} />
              ) : (
                <div style={{
                  width: '100%', height: 200,
                  background: `linear-gradient(135deg, #0a0f1e, #1e293b)`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 56, color: accent, fontFamily: 'Georgia, serif',
                }}>
                  {profile.pastorName.charAt(0)}
                </div>
              )}
              <div style={{ padding: '16px 18px 20px' }}>
                <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: accent, margin: '0 0 4px' }}>Lead Pastor</p>
                <h3 style={{ fontFamily: 'Georgia, serif', fontSize: 20, fontWeight: 700, color: '#0a0f1e', margin: '0 0 8px' }}>
                  {profile.pastorName}
                </h3>
                {profile.pastorBio && (
                  <p style={{ fontSize: 13, color: '#64748b', lineHeight: 1.7, margin: 0 }}>{profile.pastorBio}</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
