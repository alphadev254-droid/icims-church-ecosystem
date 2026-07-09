import type { PublicSermon } from './types';

interface SermonsProps {
  sermons: PublicSermon[];
  accent: string;
  variant?: 'home' | 'page';
}

function getYouTubeId(url: string): string | null {
  const patterns = [
    /youtu\.be\/([^?&]+)/,
    /youtube\.com\/watch\?v=([^?&]+)/,
    /youtube\.com\/embed\/([^?&]+)/,
    /youtube\.com\/shorts\/([^?&]+)/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m?.[1]) return m[1];
  }
  return null;
}

function fmtDate(value?: string | null) {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function SermonCard({ sermon, accent, featured = false }: { sermon: PublicSermon; accent: string; featured?: boolean }) {
  const ytId = getYouTubeId(sermon.youtubeUrl);
  const meta = [sermon.speaker, sermon.duration, fmtDate(sermon.sermonDate)].filter(Boolean).join(' · ');

  return (
    <a href={sermon.youtubeUrl} target="_blank" rel="noopener noreferrer" style={{
      display: 'flex', flexDirection: 'column', textDecoration: 'none',
      background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12,
      overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
      transition: 'box-shadow 0.2s',
    }}>
      <div style={{
        position: 'relative', background: '#0f172a',
        height: featured ? 220 : 160,
      }}>
        {ytId && (
          <img
            src={`https://img.youtube.com/vi/${ytId}/${featured ? 'hqdefault' : 'mqdefault'}.jpg`}
            alt={sermon.title}
            style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.8 }}
          />
        )}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(180deg, transparent 40%, rgba(15,23,42,0.7) 100%)',
        }} />
        <span style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%,-50%)',
          width: 44, height: 44, borderRadius: 999,
          background: accent, color: '#111822',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 16, fontWeight: 800,
        }}>▶</span>
      </div>
      <div style={{ padding: '16px 18px 18px' }}>
        {sermon.series && (
          <p style={{
            fontSize: 10, fontWeight: 700, letterSpacing: '0.14em',
            textTransform: 'uppercase', color: accent, margin: '0 0 6px',
          }}>{sermon.series}</p>
        )}
        <h3 style={{
          fontFamily: 'Georgia, serif', fontSize: featured ? 22 : 17,
          fontWeight: 700, color: '#0f172a', lineHeight: 1.25, margin: '0 0 6px',
        }}>{sermon.title}</h3>
        {meta && <p style={{ fontSize: 12, color: '#94a3b8', margin: 0 }}>{meta}</p>}
      </div>
    </a>
  );
}

export function Sermons({ sermons, accent, variant = 'home' }: SermonsProps) {
  if (!sermons.length) return null;

  const [featured, ...rest] = sermons;

  if (variant === 'page') {
    return (
      <section id="sermons" style={{ background: '#fff', padding: '80px 28px 100px' }}>
        <div style={{ maxWidth: 1400, margin: '0 auto' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px,1fr))',
            gap: 20,
          }}>
            {sermons.map(s => <SermonCard key={s.id} sermon={s} accent={accent} />)}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="sermons" style={{ background: '#111822', padding: '80px 28px 96px' }}>
      <div style={{ maxWidth: 1400, margin: '0 auto' }}>
        <div style={{
          display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between',
          gap: 20, flexWrap: 'wrap', marginBottom: 36,
        }}>
          <div>
            <p style={{
              fontSize: 11, fontWeight: 700, letterSpacing: '0.22em',
              textTransform: 'uppercase', color: accent, marginBottom: 10,
            }}>Latest Sermon</p>
            <h2 className="cp-section-title" style={{
              fontFamily: 'Georgia, "Times New Roman", serif',
              fontSize: 'clamp(2rem, 4.5vw, 3.2rem)',
              fontWeight: 800, color: '#fff', lineHeight: 1.1, margin: 0,
            }}>This week at the pulpit.</h2>
          </div>
          {sermons.length > 1 && (
            <a href="#sermons" style={{
              color: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: 8, textDecoration: 'none', padding: '10px 18px',
              fontWeight: 600, fontSize: 13,
            }}>All Sermons →</a>
          )}
        </div>

        <div className="cp-sermon-grid" style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0,1.4fr) minmax(260px,0.9fr)',
          gap: 24, alignItems: 'stretch',
        }}>
          {/* Featured */}
          <a href={featured.youtubeUrl} target="_blank" rel="noopener noreferrer" style={{
            position: 'relative', minHeight: 380, borderRadius: 14, overflow: 'hidden',
            display: 'flex', alignItems: 'flex-end', padding: 28,
            textDecoration: 'none', color: '#fff',
            background: '#0f172a',
          }}>
            {getYouTubeId(featured.youtubeUrl) && (
              <img
                src={`https://img.youtube.com/vi/${getYouTubeId(featured.youtubeUrl)}/hqdefault.jpg`}
                alt={featured.title}
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.65 }}
              />
            )}
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, transparent 30%, rgba(15,23,42,0.92) 100%)' }} />
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{
                width: 64, height: 64, borderRadius: 999, background: accent,
                color: '#111822', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 20, fontWeight: 800,
              }}>▶</span>
            </div>
            <div style={{ position: 'relative', zIndex: 1 }}>
              {featured.series && (
                <p style={{ color: accent, fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', margin: '0 0 6px' }}>
                  {featured.series}
                </p>
              )}
              <h3 style={{ fontFamily: 'Georgia, serif', fontSize: 'clamp(1.6rem,3.5vw,2.6rem)', lineHeight: 1.1, margin: '0 0 8px' }}>
                {featured.title}
              </h3>
              <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, margin: 0 }}>
                {[featured.speaker, featured.duration, fmtDate(featured.sermonDate)].filter(Boolean).join(' · ')}
              </p>
            </div>
          </a>

          {/* Side list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {(rest.length ? rest : sermons.slice(0, 2)).map(s => {
              const ytId = getYouTubeId(s.youtubeUrl);
              return (
                <a key={s.id} href={s.youtubeUrl} target="_blank" rel="noopener noreferrer" style={{
                  display: 'grid', gridTemplateColumns: '120px minmax(0,1fr)',
                  gap: 14, alignItems: 'center', textDecoration: 'none', color: '#fff',
                  border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12,
                  padding: 14, background: 'rgba(255,255,255,0.03)',
                }}>
                  <div style={{ position: 'relative', borderRadius: 8, overflow: 'hidden', aspectRatio: '16/10', background: '#0b1224' }}>
                    {ytId && (
                      <img src={`https://img.youtube.com/vi/${ytId}/mqdefault.jpg`} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    )}
                  </div>
                  <div>
                    {s.series && <p style={{ color: accent, fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 5 }}>{s.series}</p>}
                    <h3 style={{ fontFamily: 'Georgia, serif', fontSize: 16, lineHeight: 1.25, margin: '0 0 5px' }}>{s.title}</h3>
                    <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 12, margin: 0 }}>
                      {[s.speaker, s.duration].filter(Boolean).join(' · ')}
                    </p>
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
