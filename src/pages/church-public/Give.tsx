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
    <section id="give" className="cp-section" style={{ background: '#111822', padding: '82px 28px 100px' }}>
      <div style={{ maxWidth: 1400, margin: '0 auto' }}>
        <p style={{
          fontSize: 11,
          fontWeight: 800,
          letterSpacing: '0.22em',
          textTransform: 'uppercase',
          color: accent,
          marginBottom: 18,
        }}>
          Support the Ministry
        </p>

        <div className="cp-section-heading-row" style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          marginBottom: 18,
          flexWrap: 'wrap',
          gap: 18,
        }}>
          <h2 className="cp-section-title" style={{
            fontFamily: 'Georgia, "Times New Roman", serif',
            fontSize: 'clamp(2.2rem, 5vw, 4rem)',
            fontWeight: 800,
            color: '#fff',
            lineHeight: 1.08,
            margin: 0,
          }}>
            Give online.
          </h2>
        </div>

        <p style={{
          fontSize: 16,
          color: 'rgba(255,255,255,0.76)',
          lineHeight: 1.75,
          marginBottom: 38,
          maxWidth: 680,
        }}>
          Your generosity makes a difference. Every gift helps us serve our community, advance the mission, and proclaim the gospel.
        </p>

        <div className="cp-card-grid" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: 24,
        }}>
          {campaigns.map(campaign => (
            <article key={campaign.id} style={{
              background: '#fff',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: 16,
              padding: 26,
              boxShadow: '0 18px 48px rgba(0,0,0,0.18)',
              display: 'flex',
              flexDirection: 'column',
              minHeight: 300,
            }}>
              <div style={{
                width: 52,
                height: 52,
                borderRadius: 14,
                background: `linear-gradient(135deg, ${accent}, #b9750f)`,
                color: '#111822',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 20,
              }}>
                <HandHeart size={24} />
              </div>

              <p style={{
                fontSize: 11,
                fontWeight: 800,
                letterSpacing: '0.16em',
                textTransform: 'uppercase',
                color: '#c7830f',
                margin: '0 0 12px',
              }}>
                {campaign.category.replace(/_/g, ' ')}
              </p>

              <h3 style={{
                fontFamily: 'Georgia, serif',
                fontSize: 25,
                fontWeight: 800,
                color: '#101a30',
                margin: '0 0 12px',
                lineHeight: 1.2,
              }}>
                {campaign.name}
              </h3>

              {campaign.description && (
                <p style={{
                  fontSize: 14,
                  color: '#53617a',
                  lineHeight: 1.7,
                  margin: 0,
                  display: '-webkit-box',
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
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
                  marginTop: 'auto',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  alignSelf: 'flex-start',
                  borderRadius: 12,
                  padding: '14px 20px',
                  background: accent,
                  color: '#101a30',
                  fontSize: 14,
                  fontWeight: 900,
                  textDecoration: 'none',
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
