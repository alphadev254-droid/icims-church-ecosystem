import { HandHeart, ArrowRight } from 'lucide-react';
import type { PublicCampaign } from './types';

const FRONTEND = 'https://churchcentral.church';
const DARK = '#121D39';

interface GiveProps {
  campaigns: PublicCampaign[];
  accent: string;
}

function CampaignCard({ campaign, accent }: { campaign: PublicCampaign; accent: string }) {
  return (
    <article style={{
      borderRadius: 12, overflow: 'hidden',
      display: 'flex', flexDirection: 'column',
      boxShadow: '0 4px 20px rgba(18,29,57,0.12)',
      border: '1px solid #e2e8f0',
    }}>
      {/* Dark top half */}
      <div style={{
        background: DARK, padding: '20px 18px 18px',
        display: 'flex', flexDirection: 'column', gap: 10,
      }}>
        <div style={{
          width: 38, height: 38, borderRadius: 8,
          background: `${accent}22`, color: accent,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <HandHeart size={18} />
        </div>
        <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: '#fff', margin: 0 }}>
          {campaign.category.replace(/_/g, ' ')}
        </p>
        {/* Golden title */}
        <h3 style={{
          fontFamily: 'Georgia, serif', fontSize: 18, fontWeight: 700,
          color: accent, margin: 0, lineHeight: 1.25,
        }}>
          {campaign.name}
        </h3>
      </div>

      {/* White bottom half */}
      <div style={{ background: '#fff', padding: '14px 18px 16px', display: 'flex', flexDirection: 'column', flex: 1 }}>
        {campaign.description && (
          <p style={{
            fontSize: 13, color: '#64748b', lineHeight: 1.65, margin: '0 0 auto',
            display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden',
          }}>
            {campaign.description}
          </p>
        )}
        <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid #f1f5f9' }}>
          <a
            className="cp-give-card-action"
            href={`${FRONTEND}/giving/${campaign.id}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              borderRadius: 6, padding: '8px 14px',
              background: accent, color: DARK,
              fontSize: 12, fontWeight: 700, textDecoration: 'none',
            }}
          >
            Give Now <ArrowRight size={12} />
          </a>
        </div>
      </div>
    </article>
  );
}

export function Give({ campaigns, accent }: GiveProps) {
  if (!campaigns.length) return null;

  return (
    <>
      {/* White intro strip */}
      <div style={{ background: '#fff', padding: '40px 28px 0' }}>
        <div style={{ maxWidth: 1400, margin: '0 auto' }}>
          <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', color: accent, marginBottom: 8 }}>
            Support the Ministry
          </p>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14, paddingBottom: 28, borderBottom: '1px solid #e8edf5' }}>
            <h2 className="cp-section-title" style={{
              fontFamily: 'Georgia, "Times New Roman", serif',
              fontSize: 'clamp(1.8rem, 3.8vw, 2.8rem)',
              fontWeight: 800, color: DARK, lineHeight: 1.1, margin: 0,
            }}>Give online.</h2>
            <p style={{ fontSize: 13, color: '#64748b', maxWidth: 360, margin: 0, lineHeight: 1.6 }}>
              Every gift helps us serve our community, advance the mission, and proclaim the gospel.
            </p>
          </div>
        </div>
      </div>

      {/* Cards on white background */}
      <section id="give" style={{ background: '#fff', padding: '28px 28px 56px' }}>
        <div style={{ maxWidth: 1400, margin: '0 auto' }}>
          <div className="cp-card-grid" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 14,
          }}>
            {campaigns.map(c => <CampaignCard key={c.id} campaign={c} accent={accent} />)}
          </div>
        </div>
      </section>

      {/* Dark CTA banner — taller, designed */}
      <div style={{
        background: DARK,
        padding: '72px 28px 80px',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Decorative circles */}
        <div style={{
          position: 'absolute', top: -60, right: -60,
          width: 320, height: 320, borderRadius: '50%',
          background: `${accent}0d`, pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', bottom: -80, left: -40,
          width: 240, height: 240, borderRadius: '50%',
          background: `${accent}08`, pointerEvents: 'none',
        }} />
        {/* Thin accent top border */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: accent }} />

        <div style={{ maxWidth: 1400, margin: '0 auto', position: 'relative', zIndex: 1 }}>
          {/* Eyebrow */}
          <p style={{
            fontSize: 10, fontWeight: 700, letterSpacing: '0.24em',
            textTransform: 'uppercase', color: accent, marginBottom: 16,
          }}>Make an Impact</p>

          {/* Headline */}
          <h2 style={{
            fontFamily: 'Georgia, "Times New Roman", serif',
            fontSize: 'clamp(2rem, 4.5vw, 3.4rem)',
            fontWeight: 800, color: '#fff', lineHeight: 1.1,
            maxWidth: 680, margin: '0 0 14px',
          }}>
            Every gift makes a difference.{' '}
            <span style={{ color: accent }}>Your generosity changes lives.</span>
          </h2>

          <p style={{
            fontSize: 15, color: '#fff',
            lineHeight: 1.7, maxWidth: 520, marginBottom: 36,
          }}>
            Your tithes, offerings, and donations fuel the mission — reaching communities, supporting families, and spreading the gospel.
          </p>

          {/* Stats row */}
          <div style={{
            display: 'flex', gap: 32, flexWrap: 'wrap', marginBottom: 40,
            paddingBottom: 36, borderBottom: '1px solid rgba(255,255,255,0.08)',
          }}>
            {[['100%', 'Goes to ministry'], ['Secure', 'Online giving'], ['Instant', 'Receipt issued']].map(([val, label]) => (
              <div key={label}>
                <p style={{ fontFamily: 'Georgia, serif', fontSize: 26, fontWeight: 800, color: accent, margin: 0, lineHeight: 1 }}>{val}</p>
                <p style={{ fontSize: 11, color: '#fff', margin: '5px 0 0', fontWeight: 600, letterSpacing: '0.06em' }}>{label}</p>
              </div>
            ))}
          </div>

          {/* CTA buttons */}
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <a href={`${FRONTEND}/giving`} target="_blank" rel="noopener noreferrer" style={{
              display: 'inline-flex', alignItems: 'center', gap: 7,
              background: accent, color: DARK, borderRadius: 7,
              padding: '13px 24px', fontWeight: 700, fontSize: 14, textDecoration: 'none',
            }}>
              View All Campaigns <ArrowRight size={14} />
            </a>
            <a href="#give" style={{
              display: 'inline-flex', alignItems: 'center', gap: 7,
              background: 'rgba(255,255,255,0.07)', color: '#fff', borderRadius: 7,
              padding: '12px 22px', fontWeight: 600, fontSize: 14, textDecoration: 'none',
              border: '1px solid rgba(255,255,255,0.15)',
            }}>
              Give Now
            </a>
          </div>
        </div>
      </div>

      {/* White separation before footer */}
      <div style={{ background: '#fff', padding: '32px 28px', borderBottom: '1px solid #e8edf5' }}>
        <div style={{
          maxWidth: 1400, margin: '0 auto',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          gap: 16, flexWrap: 'wrap',
        }}>
          <p style={{ fontSize: 13, color: '#94a3b8', margin: 0 }}>
            Giving is safe, secure, and goes directly to the ministry.
          </p>
          <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
            {['🔒 SSL Secured', '✓ Instant Receipt', '♥ Trusted Ministry'].map(t => (
              <span key={t} style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>{t}</span>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
