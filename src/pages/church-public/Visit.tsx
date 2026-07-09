import { useState } from 'react';
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

const initialForm: VisitForm = { firstName: '', lastName: '', email: '', phone: '', serviceName: '', notes: '' };

const inputStyle = {
  width: '100%', border: '1px solid #e2e8f0', borderRadius: 8,
  padding: '13px 16px', marginBottom: 14, fontSize: 15,
  color: '#0f172a', background: '#f8f9fb', outline: 'none',
  boxSizing: 'border-box' as const,
};

export function Visit({ slug, ministryName, serviceTimes, accent }: VisitProps) {
  const [form, setForm] = useState<VisitForm>(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const update = (key: keyof VisitForm, value: string) => {
    setForm(c => ({ ...c, [key]: value }));
    setError('');
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const r = await fetch(`${API_BASE}/p/${slug}/visit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const json = await r.json().catch(() => null);
      if (!r.ok || !json?.success) throw new Error(json?.message || 'Could not send your visit request.');
      setSubmitted(true);
      setForm(initialForm);
    } catch (err: any) {
      setError(err?.message || 'Could not send your visit request.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section id="visit" style={{ background: '#fff', padding: '80px 28px' }}>
      <div className="cp-visit-grid" style={{
        maxWidth: 1400, margin: '0 auto',
        display: 'grid', gridTemplateColumns: 'minmax(0,0.95fr) minmax(300px,1.05fr)',
        gap: 48, alignItems: 'start',
      }}>
        {/* Left */}
        <div>
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', color: accent, marginBottom: 12 }}>
            First Visit
          </p>
          <h2 className="cp-section-title" style={{
            fontFamily: 'Georgia, "Times New Roman", serif',
            fontSize: 'clamp(2rem, 4.5vw, 3.2rem)',
            fontWeight: 800, color: '#0f172a', lineHeight: 1.1, marginBottom: 12,
          }}>What to expect.</h2>
          <p style={{ color: '#64748b', fontSize: 16, marginBottom: 28, lineHeight: 1.7 }}>
            Your first visit should feel like coming home.
          </p>

          {[
            ['W', 'Warm Welcome', 'Coffee, tea, and a friendly guide the moment you arrive.'],
            ['K', 'Kids Ministry', 'Safe, fun programs for children during every service.'],
            ['N', 'No Pressure', 'Come as you are. Questions, doubts, and families are welcome.'],
          ].map(([initial, title, copy]) => (
            <div key={title} style={{
              display: 'grid', gridTemplateColumns: '44px minmax(0,1fr)',
              gap: 14, marginBottom: 14, padding: '16px 18px',
              border: '1px solid #e2e8f0', borderRadius: 10,
              background: '#f8f9fb',
            }}>
              <div style={{
                width: 44, height: 44, borderRadius: 8,
                background: `${accent}18`, color: accent,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 800, fontSize: 16,
              }}>{initial}</div>
              <div>
                <h3 style={{ fontFamily: 'Georgia, serif', color: '#0f172a', fontSize: 17, margin: '0 0 4px' }}>{title}</h3>
                <p style={{ color: '#64748b', margin: 0, fontSize: 14, lineHeight: 1.6 }}>{copy}</p>
              </div>
            </div>
          ))}

          {serviceTimes.length > 0 && (
            <div style={{ background: '#111822', borderRadius: 12, padding: '20px 22px', marginTop: 20 }}>
              <h3 style={{ fontFamily: 'Georgia, serif', color: accent, fontSize: 18, margin: '0 0 14px' }}>
                Service times
              </h3>
              <div style={{ display: 'grid', gap: 10 }}>
                {serviceTimes.map((s, i) => (
                  <div key={i} style={{
                    display: 'grid', gridTemplateColumns: 'minmax(0,1fr) auto',
                    gap: 12, color: '#fff', fontSize: 14,
                  }}>
                    <span>{s.name || 'Service'}</span>
                    <span style={{ color: accent }}>{s.day} · {s.time}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right — form */}
        <form onSubmit={submit} style={{
          border: '1px solid #e2e8f0', borderRadius: 14,
          padding: '28px 26px',
          boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
          background: '#fff',
        }}>
          <h2 style={{
            fontFamily: 'Georgia, serif', color: '#0f172a',
            fontSize: 'clamp(1.6rem, 3.5vw, 2.1rem)',
            lineHeight: 1.2, margin: '0 0 22px',
          }}>Let us know you're coming</h2>

          <div className="cp-visit-form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <input required placeholder="First name" value={form.firstName} onChange={e => update('firstName', e.target.value)} style={inputStyle} />
            <input required placeholder="Last name" value={form.lastName} onChange={e => update('lastName', e.target.value)} style={inputStyle} />
          </div>
          <input required type="email" placeholder="Email" value={form.email} onChange={e => update('email', e.target.value)} style={inputStyle} />
          <input placeholder="Phone (optional)" value={form.phone} onChange={e => update('phone', e.target.value)} style={inputStyle} />
          <select value={form.serviceName} onChange={e => update('serviceName', e.target.value)} style={inputStyle}>
            <option value="">Which service will you attend?</option>
            {serviceTimes.map((s, i) => (
              <option key={i} value={s.name}>{s.name} — {s.day} {s.time}</option>
            ))}
          </select>
          <textarea
            placeholder="Anything we should know? (kids, accessibility...)"
            value={form.notes}
            onChange={e => update('notes', e.target.value)}
            style={{ ...inputStyle, minHeight: 100, resize: 'vertical' }}
          />

          {error && <p style={{ color: '#dc2626', fontSize: 13, marginTop: 4 }}>{error}</p>}
          {submitted && <p style={{ color: '#16a34a', fontSize: 13, marginTop: 4 }}>
            Thanks! {ministryName} received your visit request.
          </p>}

          <button disabled={submitting} type="submit" style={{
            width: '100%', border: 'none', borderRadius: 8,
            marginTop: 6, padding: '15px 20px',
            background: accent, color: '#111822',
            fontWeight: 700, fontSize: 15, cursor: submitting ? 'wait' : 'pointer',
          }}>
            {submitting ? 'Sending...' : 'Save My Seat'}
          </button>
        </form>
      </div>
    </section>
  );
}
