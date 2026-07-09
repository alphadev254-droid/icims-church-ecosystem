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
  firstName: string; lastName: string; email: string;
  phone: string; serviceName: string; notes: string;
}

const initialForm: VisitForm = { firstName: '', lastName: '', email: '', phone: '', serviceName: '', notes: '' };

const inp = {
  width: '100%', border: '1px solid #e2e8f0', borderRadius: 7,
  padding: '11px 14px', marginBottom: 12, fontSize: 14,
  color: '#0a0f1e', background: '#f8fafc', outline: 'none',
  boxSizing: 'border-box' as const,
};

export function Visit({ slug, ministryName, serviceTimes, accent }: VisitProps) {
  const [form, setForm] = useState<VisitForm>(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const update = (k: keyof VisitForm, v: string) => { setForm(c => ({ ...c, [k]: v })); setError(''); };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setSubmitting(true); setError('');
    try {
      const r = await fetch(`${API_BASE}/p/${slug}/visit`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form),
      });
      const json = await r.json().catch(() => null);
      if (!r.ok || !json?.success) throw new Error(json?.message || 'Could not send your visit request.');
      setSubmitted(true); setForm(initialForm);
    } catch (err: any) { setError(err?.message || 'Could not send your visit request.'); }
    finally { setSubmitting(false); }
  };

  return (
    <section id="visit" style={{ background: '#fff', padding: '56px 28px 72px' }}>
      <div className="cp-visit-grid" style={{
        maxWidth: 1400, margin: '0 auto',
        display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(280px,1fr)',
        gap: 40, alignItems: 'start',
      }}>
        {/* Left */}
        <div>
          <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', color: accent, marginBottom: 8 }}>First Visit</p>
          <h2 className="cp-section-title" style={{
            fontFamily: 'Georgia, "Times New Roman", serif',
            fontSize: 'clamp(1.7rem, 3.2vw, 2.45rem)',
            fontWeight: 800, color: '#0a0f1e', lineHeight: 1.1, marginBottom: 10,
          }}>What to expect.</h2>
          <p style={{ color: '#64748b', fontSize: 14, marginBottom: 22, lineHeight: 1.7 }}>
            Your first visit should feel like coming home.
          </p>

          {[
            ['W', 'Warm Welcome', 'Coffee, tea, and a friendly guide the moment you arrive.'],
            ['K', 'Kids Ministry', 'Safe, fun programs for children during every service.'],
            ['N', 'No Pressure', 'Come as you are. Questions, doubts, and families are welcome.'],
          ].map(([init, title, copy]) => (
            <div key={title} style={{
              display: 'grid', gridTemplateColumns: '38px minmax(0,1fr)',
              gap: 12, marginBottom: 10, padding: '13px 14px',
              border: '1px solid #e8edf5', borderRadius: 9,
              background: '#f8fafc',
            }}>
              <div style={{
                width: 38, height: 38, borderRadius: 7,
                background: `${accent}18`, color: accent,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 800, fontSize: 14,
              }}>{init}</div>
              <div>
                <h3 style={{ fontFamily: 'Georgia, serif', color: '#0a0f1e', fontSize: 15, margin: '0 0 3px', fontWeight: 700 }}>{title}</h3>
                <p style={{ color: '#64748b', margin: 0, fontSize: 13, lineHeight: 1.6 }}>{copy}</p>
              </div>
            </div>
          ))}

          {serviceTimes.length > 0 && (
            <div style={{ background: '#0a0f1e', borderRadius: 10, padding: '16px 18px', marginTop: 16 }}>
              <h3 style={{ fontFamily: 'Georgia, serif', color: accent, fontSize: 15, margin: '0 0 12px', fontWeight: 700 }}>Service times</h3>
              <div style={{ display: 'grid', gap: 8 }}>
                {serviceTimes.map((s, i) => (
                  <div key={i} className="cp-service-row" style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) auto', gap: 10, color: '#fff', fontSize: 13 }}>
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
          border: '1px solid #e2e8f0', borderRadius: 12,
          padding: '24px 22px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.07)',
          background: '#fff',
        }}>
          <h2 style={{
            fontFamily: 'Georgia, serif', color: '#0a0f1e',
            fontSize: 'clamp(1.4rem, 3vw, 1.8rem)',
            lineHeight: 1.2, margin: '0 0 18px', fontWeight: 700,
          }}>Let us know you're coming</h2>

          <div className="cp-visit-form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <input required placeholder="First name" value={form.firstName} onChange={e => update('firstName', e.target.value)} style={inp} />
            <input required placeholder="Last name" value={form.lastName} onChange={e => update('lastName', e.target.value)} style={inp} />
          </div>
          <input required type="email" placeholder="Email" value={form.email} onChange={e => update('email', e.target.value)} style={inp} />
          <input placeholder="Phone (optional)" value={form.phone} onChange={e => update('phone', e.target.value)} style={inp} />
          <select value={form.serviceName} onChange={e => update('serviceName', e.target.value)} style={inp}>
            <option value="">Which service will you attend?</option>
            {serviceTimes.map((s, i) => <option key={i} value={s.name}>{s.name} — {s.day} {s.time}</option>)}
          </select>
          <textarea placeholder="Anything we should know?" value={form.notes} onChange={e => update('notes', e.target.value)} style={{ ...inp, minHeight: 88, resize: 'vertical' }} />

          {error && <p style={{ color: '#dc2626', fontSize: 12, marginTop: 2 }}>{error}</p>}
          {submitted && <p style={{ color: '#16a34a', fontSize: 12, marginTop: 2 }}>Thanks! {ministryName} received your visit request.</p>}

          <button disabled={submitting} type="submit" style={{
            width: '100%', border: 'none', borderRadius: 7,
            marginTop: 4, padding: '13px 18px',
            background: accent, color: '#0a0f1e',
            fontWeight: 700, fontSize: 14, cursor: submitting ? 'wait' : 'pointer',
          }}>
            {submitting ? 'Sending...' : 'Save My Seat'}
          </button>
        </form>
      </div>
    </section>
  );
}
