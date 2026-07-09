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

export function Sermons({ sermons, accent, variant = 'home' }: SermonsProps) {
  if (!sermons.length) return null;

  const [featured, ...rest] = sermons;

  if (variant === 'page') {
    return (
      <section id="sermons" className="cp-section" style={{ background: '#fff', padding: '72px 28px 108px' }}>
        <div style={{ maxWidth: 1400, margin: '0 auto' }}>
          <FeaturedSermon sermon={featured} accent={accent} large />
          <div style={{ display: 'flex', gap: 14, margin: '50px 0 36px', alignItems: 'center', flexWrap: 'wrap' }}>
            <input
              placeholder="Search sermons or speakers..."
              style={{
                flex: '1 1 420px',
                minWidth: 0,
                border: '1px solid #e9dfd2',
                borderRadius: 14,
                padding: '16px 20px',
                color: '#101a30',
                fontSize: 15,
              }}
              readOnly
            />
            {['All', ...Array.from(new Set(sermons.map(s => s.series).filter(Boolean) as string[]))].map((series, index) => (
              <span key={series} style={{
                border: '1px solid #e9dfd2',
                background: index === 0 ? accent : '#fff',
                color: '#101a30',
                borderRadius: 999,
                padding: '12px 18px',
                fontSize: 13,
                fontWeight: 800,
              }}>{series}</span>
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24 }}>
            {sermons.map(sermon => (
              <a key={sermon.id} href={sermon.youtubeUrl} target="_blank" rel="noopener noreferrer" style={{
                border: '1px solid #e9dfd2',
                borderRadius: 16,
                padding: 24,
                textDecoration: 'none',
                background: '#fff',
                color: '#101a30',
                boxShadow: '0 14px 36px rgba(16,24,40,0.045)',
              }}>
                {sermon.series && <p style={{ color: accent, fontSize: 12, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 14 }}>{sermon.series}</p>}
                <h3 style={{ fontFamily: 'Georgia, serif', fontSize: 28, lineHeight: 1.15, margin: '0 0 12px' }}>{sermon.title}</h3>
                <p style={{ color: '#53617a', margin: 0 }}>{[sermon.speaker, sermon.duration, formatDate(sermon.sermonDate)].filter(Boolean).join(' - ')}</p>
              </a>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="sermons" className="cp-section" style={{ background: '#111822', padding: '82px 28px 96px' }}>
      <div style={{ maxWidth: 1400, margin: '0 auto' }}>
        <div style={{
          display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between',
          gap: 24, flexWrap: 'wrap', marginBottom: 36,
        }}>
          <div>
            <p style={{
              fontSize: 11, fontWeight: 800, letterSpacing: '0.22em',
              textTransform: 'uppercase', color: accent, marginBottom: 18,
            }}>Latest Sermon</p>
            <h2 className="cp-section-title" style={{
              fontFamily: 'Georgia, "Times New Roman", serif',
              fontSize: 'clamp(2.2rem, 5vw, 3.8rem)',
              fontWeight: 800, color: '#fff',
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
          <FeaturedSermon sermon={featured} accent={accent} />

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

function FeaturedSermon({ sermon, accent, large = false }: { sermon: PublicSermon; accent: string; large?: boolean }) {
  const featuredId = getYouTubeId(sermon.youtubeUrl);
  return (
    <a
      href={sermon.youtubeUrl}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        position: 'relative',
        minHeight: large ? 380 : 390,
        borderRadius: 20,
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'flex-end',
        padding: large ? 36 : 32,
        textDecoration: 'none',
        color: '#fff',
        border: large ? 'none' : '1px solid rgba(255,255,255,0.15)',
        background: '#0b1224',
        boxShadow: large ? '0 24px 70px rgba(16,24,40,0.14)' : undefined,
      }}
    >
      {featuredId && (
        <img
          src={`https://img.youtube.com/vi/${featuredId}/hqdefault.jpg`}
          alt={sermon.title}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.68 }}
        />
      )}
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(17,24,34,0.02), rgba(17,24,34,0.92))' }} />
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{
          width: large ? 96 : 86,
          height: large ? 96 : 86,
          borderRadius: 999,
          background: accent,
          color: '#111822',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 900,
          fontSize: 22,
        }}>Play</span>
      </div>
      <div style={{ position: 'relative', zIndex: 1 }}>
        {sermon.series && (
          <p style={{ color: accent, textTransform: 'uppercase', letterSpacing: '0.12em', fontSize: 12, fontWeight: 800 }}>
            {large ? `Featured - ${sermon.series}` : sermon.series}
          </p>
        )}
        <h3 style={{
          fontFamily: 'Georgia, serif',
          fontSize: large ? 'clamp(2.4rem, 5vw, 4rem)' : 'clamp(2rem, 4vw, 3rem)',
          lineHeight: 1.08,
          margin: '8px 0 10px',
        }}>{sermon.title}</h3>
        <p style={{ color: 'rgba(255,255,255,0.78)', margin: 0 }}>
          {[sermon.speaker, sermon.duration, formatDate(sermon.sermonDate)].filter(Boolean).join(' - ')}
        </p>
      </div>
    </a>
  );
}
