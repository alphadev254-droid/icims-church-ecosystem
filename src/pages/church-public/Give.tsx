import type { PublicCampaign } from './types';
import { resolveImg } from './utils';

const FRONTEND = 'https://churchcentral.church';

interface GiveProps {
  campaigns: PublicCampaign[];
  accent: string;
}

export function Give({ campaigns, accent }: GiveProps) {
  return (
    <section id="give" className="cp-section" style={{ background: '#faf9f7', padding: '100px 40px' }}>
      <div style={{ maxWidth: 1400, margin: '0 auto' }}>

        <p style={{
          fontSize: 10, fontWeight: 600, letterSpacing: '0.22em',
          textTransform: 'uppercase', color: '#888', marginBottom: 20,
        }}>Support the Ministry</p>

        <div style={{
          display: 'flex', justifyContent: 'space-between',
          alignItems: 'flex-end', marginBottom: 16, flexWrap: 'wrap', gap: 16,
        }}>
          <h2 className="cp-section-title" style={{
            fontFamily: 'Georgia, "Times New Roman", serif',
            fontSize: 'clamp(2rem, 4vw, 3rem)',
            fontWeight: 400, color: '#0a0a0a',
            lineHeight: 1.15, letterSpacing: '-0.01em',
            margin: 0,
          }}>Give online.</h2>
        </div>

        <p style={{
          fontSize: 14, color: '#888', lineHeight: 1.7,
          marginBottom: 56, maxWidth: 520,
        }}>
          Your generosity makes a difference. Every gift helps us serve our community, advance the mission, and proclaim the gospel.
        </p>

        {/* Campaign grid */}
        <div className="cp-card-grid" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: 1,
          background: '#e8e4de',
          border: '1px solid #e8e4de',
        }}>
          {campaigns.map(c => {
            const cImg = resolveImg(c.imageUrl);
            return (
              <div key={c.id} style={{ background: '#fff', padding: '32px 28px' }}>
                {/* Category */}
                <p style={{
                  fontSize: 10, fontWeight: 600, letterSpacing: '0.2em',
                  textTransform: 'uppercase', color: '#888', marginBottom: 14,
                }}>
                  {c.category.replace(/_/g, ' ')}
                </p>

                {/* Name */}
                <h3 style={{
                  fontFamily: 'Georgia, serif',
                  fontSize: 20, fontWeight: 400, color: '#0a0a0a',
                  marginBottom: 12, lineHeight: 1.3,
                }}>{c.name}</h3>

                {/* Description */}
                {c.description && (
                  <p style={{
                    fontSize: 13, color: '#666', lineHeight: 1.7,
                    marginBottom: 24,
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}>
                    {c.description}
                  </p>
                )}

                {/* Give link */}
                <a
                  href={`${FRONTEND}/giving/${c.id}`}
                  target="_blank" rel="noopener noreferrer"
                  style={{
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
                  Give Now →
                </a>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
