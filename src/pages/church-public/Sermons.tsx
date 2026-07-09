import type { PublicSermon } from './types';

interface SermonsProps {
  sermons: PublicSermon[];
  accent: string;
}

function getYouTubeId(url: string): string | null {
  const patterns = [
    /youtu\.be\/([^?&]+)/,
    /youtube\.com\/watch\?v=([^?&]+)/,
    /youtube\.com\/embed\/([^?&]+)/,
    /youtube\.com\/shorts\/([^?&]+)/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match?.[1]) return match[1];
  }
  return null;
}

function formatDate(value?: string | null) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function Sermons({ sermons, accent }: SermonsProps) {
  if (!sermons.length) return null;

  const [featured, ...rest] = sermons;
  const featuredId = getYouTubeId(featured.youtubeUrl);

  return (
    <section id="sermons" className="cp-section" style={{ background: '#111822', padding: '100px 40px' }}>
      <div style={{ maxWidth: 1400, margin: '0 auto' }}>
        <div style={{
          display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between',
          gap: 24, flexWrap: 'wrap', marginBottom: 46,
        }}>
          <div>
            <p style={{
              fontSize: 10, fontWeight: 700, letterSpacing: '0.22em',
              textTransform: 'uppercase', color: accent, marginBottom: 18,
            }}>Latest Sermon</p>
            <h2 className="cp-section-title" style={{
              fontFamily: 'Georgia, "Times New Roman", serif',
              fontSize: 'clamp(2.2rem, 5vw, 4rem)',
              fontWeight: 700, color: '#fff',
              lineHeight: 1.08, margin: 0,
            }}>This week at the pulpit.</h2>
          </div>
          {sermons.length > 1 && (
            <a href="#sermons-list" style={{
              color: '#fff', border: '1px solid rgba(255,255,255,0.35)',
              borderRadius: 14, textDecoration: 'none', padding: '14px 22px',
              fontWeight: 700, fontSize: 14,
            }}>All Sermons</a>
          )}
        </div>

        <div className="cp-sermon-grid" style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1.35fr) minmax(280px, 0.95fr)',
          gap: 30,
          alignItems: 'stretch',
        }}>
          <a
            href={featured.youtubeUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              position: 'relative', minHeight: 420, borderRadius: 24,
              overflow: 'hidden', display: 'flex', alignItems: 'flex-end',
              padding: 32, textDecoration: 'none', color: '#fff',
              border: '1px solid rgba(255,255,255,0.15)',
              background: '#0b1224',
            }}
          >
            {featuredId && (
              <img
                src={`https://img.youtube.com/vi/${featuredId}/hqdefault.jpg`}
                alt={featured.title}
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.62 }}
              />
            )}
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(17,24,34,0.05), rgba(17,24,34,0.92))' }} />
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{
                width: 86, height: 86, borderRadius: 999,
                background: accent, color: '#111822',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 900, fontSize: 28,
              }}>Play</span>
            </div>
            <div style={{ position: 'relative', zIndex: 1 }}>
              {featured.series && (
                <p style={{ color: accent, textTransform: 'uppercase', letterSpacing: '0.12em', fontSize: 12, fontWeight: 800 }}>
                  {featured.series}
                </p>
              )}
              <h3 style={{
                fontFamily: 'Georgia, serif', fontSize: 'clamp(2rem, 4vw, 3rem)',
                lineHeight: 1.08, margin: '8px 0 10px',
              }}>{featured.title}</h3>
              <p style={{ color: 'rgba(255,255,255,0.78)', margin: 0 }}>
                {[featured.speaker, featured.duration, formatDate(featured.sermonDate)].filter(Boolean).join(' - ')}
              </p>
            </div>
          </a>

          <div id="sermons-list" style={{ display: 'grid', gap: 20 }}>
            {(rest.length ? rest : sermons.slice(0, 2)).map(sermon => {
              const youtubeId = getYouTubeId(sermon.youtubeUrl);
              return (
                <a key={sermon.id} href={sermon.youtubeUrl} target="_blank" rel="noopener noreferrer" style={{
                  display: 'grid', gridTemplateColumns: '160px minmax(0, 1fr)',
                  gap: 18, alignItems: 'center', textDecoration: 'none',
                  color: '#fff', border: '1px solid rgba(255,255,255,0.14)',
                  borderRadius: 18, padding: 18, background: 'rgba(255,255,255,0.03)',
                }}>
                  <div style={{ position: 'relative', borderRadius: 14, overflow: 'hidden', aspectRatio: '16 / 10', background: '#0b1224' }}>
                    {youtubeId && (
                      <img src={`https://img.youtube.com/vi/${youtubeId}/mqdefault.jpg`} alt="" style={{
                        width: '100%', height: '100%', objectFit: 'cover', display: 'block',
                      }} />
                    )}
                  </div>
                  <div>
                    {sermon.series && (
                      <p style={{ color: accent, textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: 11, fontWeight: 800, marginBottom: 8 }}>
                        {sermon.series}
                      </p>
                    )}
                    <h3 style={{ fontFamily: 'Georgia, serif', fontSize: 22, lineHeight: 1.2, margin: '0 0 8px' }}>
                      {sermon.title}
                    </h3>
                    <p style={{ color: 'rgba(255,255,255,0.72)', fontSize: 13, margin: 0 }}>
                      {[sermon.speaker, sermon.duration].filter(Boolean).join(' - ')}
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
