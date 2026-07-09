import type { PublicMinistry } from './types';
import { resolveImg } from './utils';

interface MinistriesProps {
  ministries: PublicMinistry[];
  accent: string;
}

export function Ministries({ ministries, accent }: MinistriesProps) {
  if (!ministries.length) return null;

  return (
    <section id="ministries" style={{ background: '#f8f9fb', padding: '80px 28px' }}>
      <div style={{ maxWidth: 1400, margin: '0 auto' }}>

        <p style={{
          fontSize: 11, fontWeight: 700, letterSpacing: '0.22em',
          textTransform: 'uppercase', color: accent, marginBottom: 12,
        }}>Ministries</p>

        <h2 className="cp-section-title" style={{
          fontFamily: 'Georgia, "Times New Roman", serif',
          fontSize: 'clamp(2rem, 4.5vw, 3.2rem)',
          fontWeight: 800, color: '#0f172a', lineHeight: 1.1, marginBottom: 12,
        }}>Find your place to serve.</h2>

        <p style={{
          fontSize: 15, color: '#64748b', lineHeight: 1.75,
          maxWidth: 600, marginBottom: 40,
        }}>
          Discover the teams and outreaches helping our church love people, build faith, and serve the community.
        </p>

        <div className="cp-ministry-grid" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: 20,
        }}>
          {ministries.map(ministry => {
            const img = resolveImg(ministry.imageUrl || undefined);
            return (
              <article key={ministry.id} style={{
                background: '#fff', border: '1px solid #e2e8f0',
                borderRadius: 12, overflow: 'hidden',
                boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
              }}>
                {img && (
                  <img src={img} alt={ministry.name} style={{
                    width: '100%', height: 160, objectFit: 'cover', display: 'block',
                  }} />
                )}
                <div style={{ padding: '20px 20px 22px' }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: 8,
                    background: `${accent}18`, color: accent,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 18, fontWeight: 700, marginBottom: 14,
                  }}>
                    {ministry.icon || ministry.name.charAt(0).toUpperCase()}
                  </div>
                  <h3 style={{
                    fontFamily: 'Georgia, serif', color: '#0f172a',
                    fontSize: 20, lineHeight: 1.25, marginBottom: 8,
                  }}>{ministry.name}</h3>
                  <p style={{ color: '#64748b', fontSize: 14, lineHeight: 1.7, margin: 0 }}>
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
