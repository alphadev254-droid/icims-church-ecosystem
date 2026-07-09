import type { ServiceTime } from './types';

interface ServicesProps {
  serviceTimes: ServiceTime[];
  accent: string;
}

export function Services({ serviceTimes, accent }: ServicesProps) {
  return (
    <section id="services" style={{ background: '#f8f9fb', padding: '80px 28px' }}>
      <div style={{ maxWidth: 1400, margin: '0 auto' }}>

        <p style={{
          fontSize: 11, fontWeight: 700, letterSpacing: '0.22em',
          textTransform: 'uppercase', color: accent, marginBottom: 12,
        }}>Join Us</p>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 14, flexWrap: 'wrap', gap: 12 }}>
          <h2 className="cp-section-title" style={{
            fontFamily: 'Georgia, "Times New Roman", serif',
            fontSize: 'clamp(2rem, 4.5vw, 3.2rem)',
            fontWeight: 800, color: '#0f172a', lineHeight: 1.1, margin: 0,
          }}>Service times.</h2>
        </div>

        <p style={{ fontSize: 15, color: '#64748b', lineHeight: 1.7, marginBottom: 40, maxWidth: 500 }}>
          Doors open thirty minutes before each service. All are welcome — come as you are.
        </p>

        <div className="cp-services-strip" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 16,
        }}>
          {serviceTimes.map((s, i) => (
            <div key={i} className="cp-service-card" style={{
              background: '#fff',
              border: '1px solid #e2e8f0',
              borderRadius: 12,
              padding: '24px 22px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
            }}>
              <p style={{
                fontSize: 11, fontWeight: 600, letterSpacing: '0.14em',
                color: accent, marginBottom: 16, fontFamily: 'Georgia, serif',
              }}>
                {String(i + 1).padStart(2, '0')}
              </p>
              <h3 style={{
                fontFamily: 'Georgia, serif', fontSize: 18, fontWeight: 700,
                color: '#0f172a', marginBottom: 14, lineHeight: 1.3,
              }}>{s.name}</h3>
              <p style={{
                fontFamily: 'Georgia, serif', fontSize: 28, fontWeight: 800,
                color: '#0f172a', marginBottom: 6, letterSpacing: '-0.01em',
              }}>{s.time}</p>
              <p style={{
                fontSize: 12, color: '#94a3b8', letterSpacing: '0.1em',
                textTransform: 'uppercase', marginBottom: s.location ? 4 : 0,
              }}>{s.day}</p>
              {s.location && (
                <p style={{ fontSize: 12, color: '#94a3b8' }}>{s.location}</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
