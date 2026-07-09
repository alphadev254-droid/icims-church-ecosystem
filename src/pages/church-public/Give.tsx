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
        <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.45)', margin: 0 }}>
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

      {/* Dark CTA strip */}
      <div style={{ background: DARK, padding: '32px 28px' }}>
        <div style={{
          maxWidth: 1400, margin: '0 auto',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          gap: 20, flexWrap: 'wrap',
        }}>
          <p style={{ fontFamily: 'Georgia, serif', fontSize: 'clamp(1rem, 2.2vw, 1.4rem)', color: '#fff', fontWeight: 700, margin: 0 }}>
            Every gift makes a difference.{' '}
            <span style={{ color: accent }}>Your generosity changes lives.</span>
          </p>
          <a href={`${FRONTEND}/giving`} target="_blank" rel="noopener noreferrer" style={{
            display: 'inline-flex', alignItems: 'center', gap: 7,
            background: accent, color: DARK, borderRadius: 7,
            padding: '11px 20px', fontWeight: 700, fontSize: 13, textDecoration: 'none',
          }}>
            View All Campaigns <ArrowRight size={14} />
          </a>
        </div>
      </div>
    </>
  );
}
