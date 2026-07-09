import type { ServiceTime } from './types';

interface ServicesProps {
  serviceTimes: ServiceTime[];
  accent: string;
}

export function Services({ serviceTimes, accent }: ServicesProps) {
  return (
    <section id="services" style={{ background: '#fff', padding: '56px 28px' }}>
      <div style={{ maxWidth: 1400, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', color: accent, marginBottom: 6 }}>Join Us</p>
            <h2 className="cp-section-title" style={{
              fontFamily: 'Georgia, "Times New Roman", serif',
              fontSize: 'clamp(1.7rem, 3.5vw, 2.4rem)',
              fontWeight: 800, color: '#0a0f1e', lineHeight: 1.1, margin: 0,
            }}>Service times.</h2>
          </div>
          <p style={{ fontSize: 13, color: '#64748b', maxWidth: 340, margin: 0, lineHeight: 1.6 }}>
            Doors open 30 minutes before each service. All are welcome.
          </p>
        </div>

        <div className="cp-services-strip" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 12,
        }}>
          {serviceTimes.map((s, i) => (
            <div key={i} className="cp-service-card" style={{
              background: i % 2 === 0 ? '#0a0f1e' : '#fff',
              border: `1px solid ${i % 2 === 0 ? 'transparent' : '#e2e8f0'}`,
              borderRadius: 12, padding: '20px 18px',
              position: 'relative', overflow: 'hidden',
            }}>
              {i % 2 === 0 && (
                <div style={{
                  position: 'absolute', top: -20, right: -20,
                  width: 80, height: 80, borderRadius: '50%',
                  background: `${accent}18`,
                }} />
              )}
              <p style={{
                fontSize: 10, fontWeight: 700, letterSpacing: '0.16em',
                color: i % 2 === 0 ? accent : accent,
                marginBottom: 12, textTransform: 'uppercase',
              }}>
                {String(i + 1).padStart(2, '0')}
              </p>
              <h3 style={{
                fontFamily: 'Georgia, serif', fontSize: 15, fontWeight: 700,
                color: i % 2 === 0 ? '#fff' : '#0a0f1e',
                marginBottom: 10, lineHeight: 1.3,
              }}>{s.name}</h3>
              <p style={{
                fontFamily: 'Georgia, serif', fontSize: 26, fontWeight: 800,
                color: i % 2 === 0 ? accent : '#0a0f1e',
                marginBottom: 4, letterSpacing: '-0.02em', lineHeight: 1,
              }}>{s.time}</p>
              <p style={{
                fontSize: 11, color: i % 2 === 0 ? 'rgba(255,255,255,0.45)' : '#94a3b8',
                letterSpacing: '0.1em', textTransform: 'uppercase',
                marginBottom: s.location ? 3 : 0,
              }}>{s.day}</p>
              {s.location && (
                <p style={{ fontSize: 11, color: i % 2 === 0 ? 'rgba(255,255,255,0.35)' : '#94a3b8' }}>{s.location}</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
