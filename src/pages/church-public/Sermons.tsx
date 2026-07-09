import type { PublicSermon } from './types';

interface SermonsProps {
  sermons: PublicSermon[];
  accent: string;
  variant?: 'home' | 'page';
}

function getYouTubeId(url: string): string | null {
  const patterns = [/youtu\.be\/([^?&]+)/, /youtube\.com\/watch\?v=([^?&]+)/, /youtube\.com\/embed\/([^?&]+)/, /youtube\.com\/shorts\/([^?&]+)/];
  for (const p of patterns) { const m = url.match(p); if (m?.[1]) return m[1]; }
  return null;
}

function fmtDate(value?: string | null) {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function SermonCard({ sermon, accent }: { sermon: PublicSermon; accent: string }) {
  const ytId = getYouTubeId(sermon.youtubeUrl);
  const meta = [sermon.speaker, sermon.duration, fmtDate(sermon.sermonDate)].filter(Boolean).join(' · ');
  return (
    <a href={sermon.youtubeUrl} target="_blank" rel="noopener noreferrer" style={{
      display: 'flex', flexDirection: 'column', textDecoration: 'none',
      background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12,
      overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
    }}>
      <div style={{ position: 'relative', background: '#121D39', height: 150 }}>
        {ytId && <img src={`https://img.youtube.com/vi/${ytId}/mqdefault.jpg`} alt={sermon.title} style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.85 }} />}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, transparent 40%, rgba(18,29,57,0.7) 100%)' }} />
        <span style={{
          position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
          width: 38, height: 38, borderRadius: '50%',
          background: accent, color: '#121D39',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 13, fontWeight: 800,
        }}>▶</span>
      </div>
      <div style={{ padding: '14px 16px 16px' }}>
        {sermon.series && <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: accent, margin: '0 0 5px' }}>{sermon.series}</p>}
        <h3 style={{ fontFamily: 'Georgia, serif', fontSize: 16, fontWeight: 700, color: '#121D39', lineHeight: 1.25, margin: '0 0 5px' }}>{sermon.title}</h3>
        {meta && <p style={{ fontSize: 11, color: '#64748b', margin: 0 }}>{meta}</p>}
      </div>
    </a>
  );
}

export function Sermons({ sermons, accent, variant = 'home' }: SermonsProps) {
  if (!sermons.length) return null;
  const [featured, ...rest] = sermons;
  const featuredId = getYouTubeId(featured.youtubeUrl);

  if (variant === 'page') {
    return (
      <section id="sermons" style={{ background: '#fff', padding: '56px 28px 72px' }}>
        <div style={{ maxWidth: 1400, margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px,1fr))', gap: 14 }}>
            {sermons.map(s => <SermonCard key={s.id} sermon={s} accent={accent} />)}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="sermons" style={{ background: '#121D39', padding: '56px 28px 72px' }}>
      <div style={{ maxWidth: 1400, margin: '0 auto' }}>
        <div className="cp-section-head" style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', marginBottom: 28 }}>
          <div>
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', color: accent, marginBottom: 8 }}>Latest Sermon</p>
            <h2 className="cp-section-title" style={{
              fontFamily: 'Georgia, "Times New Roman", serif',
              fontSize: 'clamp(1.7rem, 3.2vw, 2.45rem)',
              fontWeight: 800, color: '#fff', lineHeight: 1.1, margin: 0,
            }}>This week at the pulpit.</h2>
          </div>
          {sermons.length > 1 && (
            <a href="#sermons" style={{
              color: '#fff', border: '1px solid rgba(255,255,255,0.35)',
              borderRadius: 7, textDecoration: 'none', padding: '9px 16px',
              fontWeight: 600, fontSize: 12,
            }}>All Sermons →</a>
          )}
        </div>

        <div className="cp-sermon-grid" style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0,1.45fr) minmax(240px,0.85fr)',
          gap: 16, alignItems: 'stretch',
        }}>
          {/* Featured */}
          <a href={featured.youtubeUrl} target="_blank" rel="noopener noreferrer" style={{
            position: 'relative', minHeight: 320, borderRadius: 12, overflow: 'hidden',
            display: 'flex', alignItems: 'flex-end', padding: '24px 22px',
            textDecoration: 'none', color: '#fff', background: '#121D39',
          }}>
            {featuredId && (
              <img src={`https://img.youtube.com/vi/${featuredId}/hqdefault.jpg`} alt={featured.title}
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.6 }} />
            )}
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, transparent 25%, rgba(18,29,57,0.96) 100%)' }} />
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{
                width: 56, height: 56, borderRadius: '50%', background: accent,
                color: '#121D39', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 18, fontWeight: 800,
              }}>▶</span>
            </div>
            <div style={{ position: 'relative', zIndex: 1 }}>
              {featured.series && <p style={{ color: accent, fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', margin: '0 0 5px' }}>{featured.series}</p>}
              <h3 style={{ fontFamily: 'Georgia, serif', fontSize: 'clamp(1.4rem,3vw,2.2rem)', lineHeight: 1.1, margin: '0 0 6px' }}>{featured.title}</h3>
              <p style={{ color: '#fff', fontSize: 12, margin: 0 }}>
                {[featured.speaker, featured.duration, fmtDate(featured.sermonDate)].filter(Boolean).join(' · ')}
              </p>
            </div>
          </a>

          {/* Side list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {(rest.length ? rest : sermons.slice(0, 2)).map(s => {
              const ytId = getYouTubeId(s.youtubeUrl);
              return (
                <a key={s.id} className="cp-sermon-list-card" href={s.youtubeUrl} target="_blank" rel="noopener noreferrer" style={{
                  display: 'grid', gridTemplateColumns: '100px minmax(0,1fr)',
                  gap: 12, alignItems: 'center', textDecoration: 'none', color: '#fff',
                  border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10,
                  padding: 12, background: 'rgba(255,255,255,0.05)',
                }}>
                  <div style={{ position: 'relative', borderRadius: 7, overflow: 'hidden', aspectRatio: '16/10', background: '#0b1224' }}>
                    {ytId && <img src={`https://img.youtube.com/vi/${ytId}/mqdefault.jpg`} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                  </div>
                  <div>
                    {s.series && <p style={{ color: accent, fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 4 }}>{s.series}</p>}
                    <h3 style={{ fontFamily: 'Georgia, serif', fontSize: 14, lineHeight: 1.25, margin: '0 0 4px', color: '#fff' }}>{s.title}</h3>
                    <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: 11, margin: 0 }}>{[s.speaker, s.duration].filter(Boolean).join(' · ')}</p>
                  </div>
                </a>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
