import type { PublicMinistry } from './types';
import { resolveImg } from './utils';

interface MinistriesProps {
  ministries: PublicMinistry[];
  accent: string;
}

export function Ministries({ ministries, accent }: MinistriesProps) {
  if (!ministries.length) return null;

  return (
    <section id="ministries" className="cp-section" style={{ background: '#faf9f7', padding: '78px 28px' }}>
      <div style={{ maxWidth: 1400, margin: '0 auto' }}>
        <p style={{
          fontSize: 11, fontWeight: 800, letterSpacing: '0.22em',
          textTransform: 'uppercase', color: accent, marginBottom: 18,
        }}>Ministries</p>

        <h2 className="cp-section-title" style={{
          fontFamily: 'Georgia, "Times New Roman", serif',
          fontSize: 'clamp(2.2rem, 5vw, 3.8rem)',
          fontWeight: 800, color: '#101a30',
          lineHeight: 1.08, marginBottom: 18,
        }}>Find your place to serve.</h2>

        <p style={{
          fontSize: 16, color: '#53617a', lineHeight: 1.75,
          maxWidth: 680, marginBottom: 36,
        }}>
          Discover the teams and outreaches helping our church love people, build faith, and serve the community.
        </p>

        <div className="cp-ministry-grid" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: 22,
        }}>
          {ministries.map(ministry => {
            const img = resolveImg(ministry.imageUrl || undefined);
            return (
              <article key={ministry.id} style={{
                background: '#fff',
                border: '1px solid #e9dfd2',
                borderRadius: 16,
                overflow: 'hidden',
                boxShadow: '0 16px 42px rgba(16, 24, 40, 0.055)',
              }}>
                {img && (
                  <img src={img} alt={ministry.name} style={{
                    width: '100%', height: 180, objectFit: 'cover', display: 'block',
                  }} />
                )}
                <div style={{ padding: '24px 24px 26px' }}>
                  <div style={{
                    width: 48, height: 48, borderRadius: 14,
                    background: `linear-gradient(135deg, ${accent}, #c7830f)`,
                    color: '#111822', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', fontSize: 20, fontWeight: 800,
                    marginBottom: 20,
                  }}>
                    {ministry.icon || ministry.name.charAt(0).toUpperCase()}
                  </div>
                  <h3 style={{
                    fontFamily: 'Georgia, serif',
                    color: '#101a30', fontSize: 24,
                    lineHeight: 1.2, marginBottom: 12,
                  }}>{ministry.name}</h3>
                  <p style={{ color: '#53617a', fontSize: 14, lineHeight: 1.75, margin: 0 }}>
                    {ministry.description}
                  </p>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
