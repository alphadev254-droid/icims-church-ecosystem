import { HandHeart } from 'lucide-react';
import type { PublicCampaign } from './types';

const FRONTEND = 'https://churchcentral.church';

interface GiveProps {
  campaigns: PublicCampaign[];
  accent: string;
}

export function Give({ campaigns, accent }: GiveProps) {
  if (!campaigns.length) return null;

  return (
    <section id="give" style={{ background: '#111822', padding: '80px 28px 96px' }}>
      <div style={{ maxWidth: 1400, margin: '0 auto' }}>

        <p style={{
          fontSize: 11, fontWeight: 700, letterSpacing: '0.22em',
          textTransform: 'uppercase', color: accent, marginBottom: 12,
        }}>Support the Ministry</p>

        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end',
          marginBottom: 14, flexWrap: 'wrap', gap: 16,
        }}>
          <h2 className="cp-section-title" style={{
            fontFamily: 'Georgia, "Times New Roman", serif',
            fontSize: 'clamp(2rem, 4.5vw, 3.2rem)',
            fontWeight: 800, color: '#fff', lineHeight: 1.1, margin: 0,
          }}>Give online.</h2>
        </div>

        <p style={{
          fontSize: 15, color: 'rgba(255,255,255,0.65)', lineHeight: 1.75,
          marginBottom: 40, maxWidth: 600,
        }}>
          Your generosity makes a difference. Every gift helps us serve our community, advance the mission, and proclaim the gospel.
        </p>

        <div className="cp-card-grid" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px,1fr))',
          gap: 20,
        }}>
          {campaigns.map(campaign => (
            <article key={campaign.id} style={{
              background: '#1e293b', border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 12, padding: 22,
              display: 'flex', flexDirection: 'column', minHeight: 280,
            }}>
              <div style={{
                width: 44, height: 44, borderRadius: 10,
                background: `${accent}22`, color: accent,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: 16,
              }}>
                <HandHeart size={22} />
              </div>

              <p style={{
                fontSize: 10, fontWeight: 700, letterSpacing: '0.16em',
                textTransform: 'uppercase', color: accent, margin: '0 0 8px',
              }}>
                {campaign.category.replace(/_/g, ' ')}
              </p>

              <h3 style={{
                fontFamily: 'Georgia, serif', fontSize: 22, fontWeight: 700,
                color: '#fff', margin: '0 0 10px', lineHeight: 1.25,
              }}>
                {campaign.name}
              </h3>

              {campaign.description && (
                <p style={{
                  fontSize: 13, color: 'rgba(255,255,255,0.55)', lineHeight: 1.7, margin: 0,
                  display: '-webkit-box', WebkitLineClamp: 3,
                  WebkitBoxOrient: 'vertical', overflow: 'hidden',
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
                  marginTop: 'auto', paddingTop: 18,
                  display: 'inline-flex', alignItems: 'center', alignSelf: 'flex-start',
                  borderRadius: 8, padding: '12px 18px',
                  background: accent, color: '#111822',
                  fontSize: 13, fontWeight: 700, textDecoration: 'none',
                }}
              >
                Give Now
              </a>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
