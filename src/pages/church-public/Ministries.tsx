import type { PublicMinistry } from './types';
import { resolveImg } from './utils';

interface MinistriesProps {
  ministries: PublicMinistry[];
  accent: string;
}

export function Ministries({ ministries, accent }: MinistriesProps) {
  if (!ministries.length) return null;

  return (
    <section id="ministries" style={{ background: '#fff', padding: '56px 28px' }}>
      <div style={{ maxWidth: 1400, margin: '0 auto' }}>
        <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', color: accent, marginBottom: 8 }}>Ministries</p>

        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
          <h2 className="cp-section-title" style={{
            fontFamily: 'Georgia, "Times New Roman", serif',
            fontSize: 'clamp(1.7rem, 3.2vw, 2.45rem)',
            fontWeight: 800, color: '#0a0f1e', lineHeight: 1.1, margin: 0,
          }}>Find your place to serve.</h2>
          <p style={{ fontSize: 13, color: '#64748b', maxWidth: 360, margin: 0, lineHeight: 1.6 }}>
            Teams and outreaches helping our church love people and serve the community.
          </p>
        </div>

        <div className="cp-ministry-grid" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 14,
        }}>
          {ministries.map((ministry, i) => {
            const img = resolveImg(ministry.imageUrl || undefined);
            const isDark = i % 3 === 0;
            return (
              <article key={ministry.id} style={{
                background: isDark ? '#0a0f1e' : '#fff',
                border: `1px solid ${isDark ? 'transparent' : '#e2e8f0'}`,
                borderRadius: 12, overflow: 'hidden',
                boxShadow: isDark ? '0 8px 32px rgba(0,0,0,0.18)' : '0 2px 8px rgba(0,0,0,0.04)',
                display: 'flex', flexDirection: 'column',
              }}>
                {img && (
                  <div style={{ position: 'relative', height: 140, overflow: 'hidden' }}>
                    <img src={img} alt={ministry.name} style={{
                      width: '100%', height: '100%', objectFit: 'cover', display: 'block',
                    }} />
                    <div style={{ position: 'absolute', inset: 0, background: isDark ? 'rgba(10,15,30,0.3)' : 'transparent' }} />
                  </div>
                )}
                <div style={{ padding: '16px 18px 20px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 8,
                    background: isDark ? `${accent}22` : `${accent}15`,
                    color: accent,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 16, fontWeight: 700, marginBottom: 12,
                  }}>
                    {ministry.icon || ministry.name.charAt(0).toUpperCase()}
                  </div>
                  <h3 style={{
                    fontFamily: 'Georgia, serif', color: isDark ? '#fff' : '#0a0f1e',
                    fontSize: 17, lineHeight: 1.25, marginBottom: 6, fontWeight: 700,
                  }}>{ministry.name}</h3>
                  <p style={{ color: isDark ? 'rgba(255,255,255,0.55)' : '#64748b', fontSize: 13, lineHeight: 1.65, margin: 0 }}>
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
