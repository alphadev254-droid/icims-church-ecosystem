import { HandHeart, ArrowRight } from 'lucide-react';
import type { PublicCampaign } from './types';

const FRONTEND = 'https://churchcentral.church';

interface GiveProps {
  campaigns: PublicCampaign[];
  accent: string;
}

export function Give({ campaigns, accent }: GiveProps) {
  if (!campaigns.length) return null;

  return (
    <>
      <section id="give" style={{ background: '#0a0f1e', padding: '56px 28px 72px' }}>
        <div style={{ maxWidth: 1400, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 14 }}>
            <div>
              <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', color: accent, marginBottom: 8 }}>Support the Ministry</p>
              <h2 className="cp-section-title" style={{
                fontFamily: 'Georgia, "Times New Roman", serif',
                fontSize: 'clamp(1.8rem, 3.8vw, 2.8rem)',
                fontWeight: 800, color: '#fff', lineHeight: 1.1, margin: 0,
              }}>Give online.</h2>
            </div>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', maxWidth: 360, margin: 0, lineHeight: 1.6 }}>
              Every gift helps us serve our community, advance the mission, and proclaim the gospel.
            </p>
          </div>

          <div className="cp-card-grid" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(230px,1fr))',
            gap: 14,
          }}>
            {campaigns.map((campaign, i) => (
              <article key={campaign.id} style={{
                background: i % 2 === 0 ? 'rgba(255,255,255,0.04)' : `${accent}12`,
                border: `1px solid ${i % 2 === 0 ? 'rgba(255,255,255,0.08)' : `${accent}30`}`,
                borderRadius: 12, padding: '20px 18px',
                display: 'flex', flexDirection: 'column',
              }}>
                <div style={{
                  width: 38, height: 38, borderRadius: 8,
                  background: `${accent}20`, color: accent,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginBottom: 14,
                }}>
                  <HandHeart size={18} />
                </div>

                <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: accent, margin: '0 0 6px' }}>
                  {campaign.category.replace(/_/g, ' ')}
                </p>

                <h3 style={{ fontFamily: 'Georgia, serif', fontSize: 19, fontWeight: 700, color: '#fff', margin: '0 0 8px', lineHeight: 1.25 }}>
                  {campaign.name}
                </h3>

                {campaign.description && (
                  <p style={{
                    fontSize: 12, color: 'rgba(255,255,255,0.5)', lineHeight: 1.65, margin: '0 0 auto',
                    display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                  }}>
                    {campaign.description}
                  </p>
                )}

                <a
                  className="cp-give-card-action"
                  href={`${FRONTEND}/giving/${campaign.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    marginTop: 16,
                    display: 'inline-flex', alignItems: 'center', gap: 6, alignSelf: 'flex-start',
                    borderRadius: 7, padding: '10px 16px',
                    background: accent, color: '#0a0f1e',
                    fontSize: 12, fontWeight: 700, textDecoration: 'none',
                  }}
                >
                  Give Now <ArrowRight size={13} />
                </a>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* White separator before footer */}
      <div style={{ background: '#fff', padding: '40px 28px' }}>
        <div style={{
          maxWidth: 1400, margin: '0 auto',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          gap: 20, flexWrap: 'wrap',
        }}>
          <p style={{ fontFamily: 'Georgia, serif', fontSize: 'clamp(1.1rem, 2.5vw, 1.5rem)', color: '#0a0f1e', fontWeight: 700, margin: 0 }}>
            Every gift makes a difference.
          </p>
          <a href={`${FRONTEND}/giving`} target="_blank" rel="noopener noreferrer" style={{
            display: 'inline-flex', alignItems: 'center', gap: 7,
            background: '#0a0f1e', color: '#fff', borderRadius: 7,
            padding: '11px 20px', fontWeight: 700, fontSize: 13, textDecoration: 'none',
          }}>
            View All Campaigns <ArrowRight size={14} />
          </a>
        </div>
      </div>
    </>
  );
}
