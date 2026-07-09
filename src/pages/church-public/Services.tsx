import type { ServiceTime } from './types';

interface ServicesProps {
  serviceTimes: ServiceTime[];
  accent: string;
}

export function Services({ serviceTimes, accent }: ServicesProps) {
  return (
    <section id="services" className="cp-section" style={{ background: '#fff', padding: '100px 40px' }}>
      <div style={{ maxWidth: 1400, margin: '0 auto' }}>

        <p style={{
          fontSize: 10, fontWeight: 600, letterSpacing: '0.22em',
          textTransform: 'uppercase', color: '#888', marginBottom: 20,
        }}>Join Us</p>

        <div style={{
          display: 'flex', justifyContent: 'space-between',
          alignItems: 'flex-end', marginBottom: 16, flexWrap: 'wrap', gap: 16,
        }}>
          <h2 className="cp-section-title" style={{
            fontFamily: 'Georgia, "Times New Roman", serif',
            fontSize: 'clamp(2rem, 4vw, 3rem)',
            fontWeight: 400, color: '#0a0a0a',
            lineHeight: 1.15, letterSpacing: '-0.01em',
            margin: 0,
          }}>Service times.</h2>
        </div>

        <p style={{
          fontSize: 14, color: '#888', lineHeight: 1.7,
          marginBottom: 56, maxWidth: 480,
        }}>
          Doors open thirty minutes before each service. All are welcome — come as you are.
        </p>

        {/* Service cards grid */}
        <div className="cp-services-strip" style={{
          display: 'flex',
          gap: 1,
          overflowX: 'auto',
          background: '#e8e4de',
          border: '1px solid #e8e4de',
          scrollbarWidth: 'thin' as const,
          scrollbarColor: '#ccc transparent',
        }}>
          {serviceTimes.map((s, i) => (
            <div key={i} className="cp-service-card" style={{
              background: '#fff',
              minWidth: 220, flexShrink: 0,
              padding: '36px 32px',
              position: 'relative',
            }}>
              {/* Number */}
              <p style={{
                fontSize: 11, fontWeight: 400, letterSpacing: '0.15em',
                color: '#bbb', marginBottom: 20,
                fontFamily: 'Georgia, serif',
              }}>
                {String(i).padStart(2, '0')}
              </p>

              {/* Service name */}
              <h3 style={{
                fontFamily: 'Georgia, serif',
                fontSize: 18, fontWeight: 400, color: '#0a0a0a',
                marginBottom: 16, lineHeight: 1.3,
              }}>{s.name}</h3>

              {/* Time — large */}
              <p style={{
                fontFamily: 'Georgia, serif',
                fontSize: 28, fontWeight: 400, color: '#0a0a0a',
                marginBottom: 8, letterSpacing: '-0.01em',
              }}>{s.time}</p>

              {/* Day */}
              <p style={{
                fontSize: 12, color: '#888', letterSpacing: '0.1em',
                textTransform: 'uppercase', marginBottom: s.location ? 6 : 0,
              }}>{s.day}</p>

              {/* Location */}
              {s.location && (
                <p style={{ fontSize: 12, color: '#aaa' }}>{s.location}</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
