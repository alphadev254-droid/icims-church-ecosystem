import { HandCoins, ChevronRight } from 'lucide-react';
import type { PublicCampaign } from './types';
import { resolveImg } from './utils';

const FRONTEND = 'https://churchcentral.church';

interface GiveProps {
  campaigns: PublicCampaign[];
  accent: string;
}

export function Give({ campaigns, accent }: GiveProps) {
  return (
    <section id="give" style={{ background: `${accent}14`, padding: '80px 24px' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <p style={{ color: accent, fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 8 }}>
          Support the Ministry
        </p>
        <h2 style={{ fontSize: 'clamp(1.6rem, 3vw, 2.4rem)', fontWeight: 800, color: '#111', marginBottom: 12 }}>
          Give Online
        </h2>
        <p style={{ fontSize: 16, color: '#6b7280', lineHeight: 1.7, maxWidth: 560, marginBottom: 44 }}>
          Your generosity makes a difference. Every gift helps us serve our community.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 24 }}>
          {campaigns.map(c => {
            const cImg = resolveImg(c.imageUrl);
            return (
              <div key={c.id} style={{
                background: '#fff', borderRadius: 16,
                overflow: 'hidden', border: '1px solid #ede9e3',
                boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
              }}>
                {cImg && (
                  <img src={cImg} alt={c.name} style={{ width: '100%', height: 150, objectFit: 'cover' }} />
                )}
                <div style={{ padding: '22px' }}>
                  <span style={{
                    display: 'inline-block',
                    background: `${accent}22`, color: accent,
                    fontSize: 11, fontWeight: 700,
                    textTransform: 'uppercase', letterSpacing: '0.1em',
                    padding: '3px 10px', borderRadius: 9999, marginBottom: 10,
                  }}>
                    {c.category.replace(/_/g, ' ')}
                  </span>
                  <h3 style={{ fontWeight: 700, fontSize: 17, color: '#111', marginBottom: 8 }}>{c.name}</h3>
                  {c.description && (
                    <p style={{
                      fontSize: 13, color: '#6b7280', lineHeight: 1.65, marginBottom: 18,
                      display: '-webkit-box', WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical', overflow: 'hidden',
                    }}>
                      {c.description}
                    </p>
                  )}
                  <a
                    href={`${FRONTEND}/giving/${c.id}`}
                    target="_blank" rel="noopener noreferrer"
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 6,
                      background: accent, color: '#fff',
                      padding: '10px 20px', borderRadius: 8,
                      fontSize: 13, fontWeight: 700, textDecoration: 'none',
                    }}
                  >
                    <HandCoins size={15} /> Give Now <ChevronRight size={14} />
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
