import type { ServiceTime } from './types';

interface ServicesProps {
  serviceTimes: ServiceTime[];
  accent: string;
}

export function Services({ serviceTimes, accent }: ServicesProps) {
  return (
    <section id="services" className="cp-section" style={{ background: '#fff', padding: '76px 28px' }}>
      <div style={{ maxWidth: 1400, margin: '0 auto' }}>

        <p style={{
          fontSize: 11, fontWeight: 800, letterSpacing: '0.22em',
          textTransform: 'uppercase', color: accent, marginBottom: 16,
        }}>Join Us</p>

        <div className="cp-section-heading-row" style={{
          display: 'flex', justifyContent: 'space-between',
          alignItems: 'flex-end', marginBottom: 16, flexWrap: 'wrap', gap: 16,
        }}>
          <h2 className="cp-section-title" style={{
            fontFamily: 'Georgia, "Times New Roman", serif',
            fontSize: 'clamp(2.2rem, 5vw, 3.7rem)',
            fontWeight: 800, color: '#101a30',
            lineHeight: 1.08,
            margin: 0,
          }}>Service times.</h2>
        </div>

        <p style={{
          fontSize: 15, color: '#53617a', lineHeight: 1.7,
          marginBottom: 34, maxWidth: 520,
        }}>
          Doors open thirty minutes before each service. All are welcome — come as you are.
        </p>

        {/* Service cards grid */}
        <div className="cp-services-strip" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 18,
        }}>
          {serviceTimes.map((s, i) => (
            <div key={i} className="cp-service-card" style={{
              background: '#fff',
              border: '1px solid #e9dfd2',
              borderRadius: 16,
              minWidth: 0, flexShrink: 0,
              padding: '28px 26px',
              position: 'relative',
              boxShadow: '0 14px 34px rgba(16,24,40,0.045)',
            }}>
              {/* Number */}
              <p style={{
                fontSize: 11, fontWeight: 400, letterSpacing: '0.15em',
                color: accent, marginBottom: 18,
                fontFamily: 'Georgia, serif',
              }}>
                {String(i).padStart(2, '0')}
              </p>

              {/* Service name */}
              <h3 style={{
                fontFamily: 'Georgia, serif',
                fontSize: 20, fontWeight: 800, color: '#101a30',
                marginBottom: 16, lineHeight: 1.3,
              }}>{s.name}</h3>

              {/* Time — large */}
              <p style={{
                fontFamily: 'Georgia, serif',
                fontSize: 30, fontWeight: 800, color: '#101a30',
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
