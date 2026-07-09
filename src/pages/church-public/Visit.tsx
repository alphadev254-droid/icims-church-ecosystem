import { useState } from 'react';
import type React from 'react';
import type { ServiceTime } from './types';

const API_BASE = import.meta.env.VITE_API_BASE_URL as string;

interface VisitProps {
  slug: string;
  ministryName: string;
  serviceTimes: ServiceTime[];
  accent: string;
}

interface VisitForm {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  serviceName: string;
  notes: string;
}

const initialForm: VisitForm = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  serviceName: '',
  notes: '',
};

export function Visit({ slug, ministryName, serviceTimes, accent }: VisitProps) {
  const [form, setForm] = useState<VisitForm>(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const update = (key: keyof VisitForm, value: string) => {
    setForm(current => ({ ...current, [key]: value }));
    setError('');
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const response = await fetch(`${API_BASE}/p/${slug}/visit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const json = await response.json().catch(() => null);
      if (!response.ok || !json?.success) {
        throw new Error(json?.message || 'Could not send your visit request.');
      }
      setSubmitted(true);
      setForm(initialForm);
    } catch (err: any) {
      setError(err?.message || 'Could not send your visit request.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section id="visit" className="cp-section" style={{ background: '#fff', padding: '96px 40px' }}>
      <div className="cp-visit-grid" style={{
        maxWidth: 1400, margin: '0 auto',
        display: 'grid', gridTemplateColumns: 'minmax(0, 0.95fr) minmax(320px, 1.05fr)',
        gap: 60, alignItems: 'start',
      }}>
        <div>
          <h2 className="cp-section-title" style={{
            fontFamily: 'Georgia, "Times New Roman", serif',
            color: '#101a30', fontSize: 'clamp(2.2rem, 5vw, 4rem)',
            lineHeight: 1.08, marginBottom: 14,
          }}>What to expect</h2>
          <p style={{ color: '#53617a', fontSize: 18, marginBottom: 38 }}>
            Your first visit should feel like coming home.
          </p>

          {[
            ['Warm Welcome', 'Coffee, tea, and a friendly guide the moment you arrive.'],
            ['Kids Ministry', 'Safe, fun programs for children during every service.'],
            ['No Pressure', 'Come as you are. Questions, doubts, and families are welcome.'],
          ].map(([title, copy]) => (
            <div key={title} style={{
              border: '1px solid #e9dfd2', borderRadius: 18,
              padding: 26, display: 'grid', gridTemplateColumns: '58px minmax(0, 1fr)',
              gap: 18, marginBottom: 20, background: '#fff',
              boxShadow: '0 14px 34px rgba(16, 24, 40, 0.05)',
            }}>
              <div style={{
                width: 56, height: 56, borderRadius: 14,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: `linear-gradient(135deg, ${accent}, #c7830f)`,
                color: '#101a30', fontWeight: 900,
              }}>{title.charAt(0)}</div>
              <div>
                <h3 style={{ fontFamily: 'Georgia, serif', color: '#101a30', fontSize: 24, margin: '0 0 8px' }}>
                  {title}
                </h3>
                <p style={{ color: '#53617a', margin: 0, lineHeight: 1.6 }}>{copy}</p>
              </div>
            </div>
          ))}

          {serviceTimes.length > 0 && (
            <div style={{ background: '#111822', borderRadius: 18, padding: 30, marginTop: 38 }}>
              <h3 style={{ fontFamily: 'Georgia, serif', color: accent, fontSize: 26, margin: '0 0 20px' }}>
                Service times
              </h3>
              <div style={{ display: 'grid', gap: 12 }}>
                {serviceTimes.map((service, index) => (
                  <div key={`${service.name}-${index}`} style={{
                    display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto',
                    gap: 14, color: '#fff', fontSize: 15,
                  }}>
                    <span>{service.name || 'Service'}</span>
                    <span style={{ color: accent }}>{service.day} - {service.time}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <form onSubmit={submit} style={{
          border: '1px solid #e9dfd2', borderRadius: 26,
          padding: '42px clamp(22px, 4vw, 40px)',
          boxShadow: '0 24px 65px rgba(16, 24, 40, 0.10)',
          background: '#fff',
        }}>
          <h2 style={{
            fontFamily: 'Georgia, serif', color: '#101a30',
            fontSize: 'clamp(1.8rem, 4vw, 2.4rem)',
            lineHeight: 1.14, margin: '0 0 30px',
          }}>Let us know you are coming</h2>

          <div className="cp-visit-form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
            <input required placeholder="First name" value={form.firstName} onChange={e => update('firstName', e.target.value)} style={inputStyle} />
            <input required placeholder="Last name" value={form.lastName} onChange={e => update('lastName', e.target.value)} style={inputStyle} />
          </div>
          <input required type="email" placeholder="Email" value={form.email} onChange={e => update('email', e.target.value)} style={inputStyle} />
          <input placeholder="Phone (optional)" value={form.phone} onChange={e => update('phone', e.target.value)} style={inputStyle} />
          <select value={form.serviceName} onChange={e => update('serviceName', e.target.value)} style={inputStyle}>
            <option value="">Which service will you attend?</option>
            {serviceTimes.map((service, index) => (
              <option key={`${service.name}-${index}`} value={service.name}>
                {service.name} - {service.day} {service.time}
              </option>
            ))}
          </select>
          <textarea placeholder="Anything we should know? (kids, accessibility...)" value={form.notes} onChange={e => update('notes', e.target.value)} style={{ ...inputStyle, minHeight: 116, resize: 'vertical' }} />

          {error && <p style={{ color: '#b42318', fontSize: 14, marginTop: 6 }}>{error}</p>}
          {submitted && <p style={{ color: '#027a48', fontSize: 14, marginTop: 6 }}>
            Thanks. {ministryName} received your visit request.
          </p>}

          <button disabled={submitting} type="submit" style={{
            width: '100%', border: 'none', borderRadius: 12,
            marginTop: 20, padding: '17px 22px',
            background: `linear-gradient(135deg, ${accent}, #c7830f)`,
            color: '#101a30', fontWeight: 800, fontSize: 16,
            cursor: submitting ? 'wait' : 'pointer',
          }}>
            {submitting ? 'Sending...' : 'Save My Seat'}
          </button>
        </form>
      </div>
    </section>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  border: '1px solid #e2d8cc',
  borderRadius: 14,
  padding: '17px 20px',
  marginBottom: 18,
  fontSize: 16,
  color: '#101a30',
  background: '#fdfbf8',
  outline: 'none',
};
