/**
 * ChurchPublicPage — rendered when visiting a subdomain like
 * grace-community-church.churchcentral.church
 *
 * No auth, no dashboard layout. Fetches from GET /api/p/:slug.
 */

import { useEffect, useState } from 'react';
import { ExternalLink, MapPin, Phone, Mail, Clock, Facebook, Youtube, MessageCircle, Calendar, HandCoins, ChevronRight } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE_URL as string;

// ─── Types ────────────────────────────────────────────────────────────────────

interface ServiceTime { name: string; day: string; time: string; location?: string; }

interface Profile {
  logoUrl?: string;
  bannerUrl?: string;
  primaryColor?: string;
  tagline?: string;
  aboutText?: string;
  pastorName?: string;
  pastorPhoto?: string;
  pastorBio?: string;
  visionText?: string;
  missionText?: string;
  serviceTimes?: string; // JSON
  phone?: string;
  email?: string;
  address?: string;
  facebookUrl?: string;
  youtubeUrl?: string;
  whatsappNumber?: string;
}

interface PublicEvent {
  id: string;
  title: string;
  description: string;
  date: string;
  endDate: string;
  time: string;
  location: string;
  imageUrl?: string;
  isFree: boolean;
  ticketPrice?: number;
  currency?: string;
  requiresTicket: boolean;
  church: { name: string };
}

interface PublicCampaign {
  id: string;
  name: string;
  description?: string;
  category: string;
  targetAmount?: number;
  currency: string;
  imageUrl?: string;
  church: { name: string };
}

interface PageData {
  profile: Profile;
  ministryName: string;
  events: PublicEvent[];
  campaigns: PublicCampaign[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseServiceTimes(json?: string): ServiceTime[] {
  if (!json) return [];
  try { return JSON.parse(json) as ServiceTime[]; } catch { return []; }
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
}

// ─── Section wrapper ──────────────────────────────────────────────────────────

function Section({ id, children, className = '' }: { id?: string; children: React.ReactNode; className?: string }) {
  return (
    <section id={id} className={`py-16 md:py-20 ${className}`}>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px' }}>
        {children}
      </div>
    </section>
  );
}

function SectionLabel({ text, color }: { text: string; color: string }) {
  return (
    <p style={{ color, fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 8 }}>
      {text}
    </p>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function ChurchPublicPage({ slug }: { slug: string }) {
  const [data, setData] = useState<PageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    fetch(`${API_BASE}/p/${slug}`)
      .then(r => {
        if (!r.ok) { setNotFound(true); setLoading(false); return null; }
        return r.json();
      })
      .then(json => {
        if (json?.success) { setData(json.data); }
        setLoading(false);
      })
      .catch(() => { setNotFound(true); setLoading(false); });
  }, [slug]);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', fontFamily: 'sans-serif', color: '#888' }}>
        Loading...
      </div>
    );
  }

  if (notFound || !data) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', fontFamily: 'sans-serif', gap: 12 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#111' }}>Page not found</h1>
        <p style={{ color: '#888', fontSize: 14 }}>This church page doesn't exist or hasn't been published yet.</p>
        <a href="https://churchcentral.church" style={{ color: '#d4a574', fontSize: 14 }}>← Back to ICIMS</a>
      </div>
    );
  }

  const { profile, ministryName, events, campaigns } = data;
  const accent = profile.primaryColor || '#d4a574';
  const serviceTimes = parseServiceTimes(profile.serviceTimes);
  const hasAbout = !!(profile.aboutText || profile.pastorName || profile.visionText || profile.missionText);
  const hasServices = serviceTimes.length > 0;
  const hasContact = !!(profile.phone || profile.email || profile.address);
  const hasEvents = events.length > 0;
  const hasCampaigns = campaigns.length > 0;

  const FRONTEND = 'https://churchcentral.church';
  const BACKEND  = API_BASE.replace('/api', '');

  // Resolve image URLs — handle both absolute URLs and local /uploads/ paths
  const resolveImg = (url?: string) =>
    url ? (url.startsWith('http') ? url : `${BACKEND}${url}`) : null;

  const logoSrc      = resolveImg(profile.logoUrl);
  const bannerSrc    = resolveImg(profile.bannerUrl);
  const pastorSrc    = resolveImg(profile.pastorPhoto);

  return (
    <div style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', color: '#1f2937', background: '#fff' }}>

      {/* ── HERO ── */}
      <section style={{
        position: 'relative', minHeight: '70vh', display: 'flex', alignItems: 'center',
        background: bannerSrc
          ? `url(${bannerSrc}) center/cover no-repeat`
          : 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
      }}>
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.58)' }} />
        <div style={{ position: 'relative', zIndex: 1, maxWidth: 1100, margin: '0 auto', padding: '80px 24px', width: '100%' }}>
          {logoSrc ? (
            <img src={logoSrc} alt={ministryName} style={{ height: 72, width: 72, borderRadius: '50%', objectFit: 'cover', border: '3px solid rgba(255,255,255,0.3)', marginBottom: 20 }} />
          ) : (
            // Default logo placeholder — church icon
            <div style={{ height: 72, width: 72, borderRadius: '50%', background: `${accent}33`, border: `3px solid ${accent}66`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20, fontSize: 28 }}>
              ⛪
            </div>
          )}
          <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', fontWeight: 800, color: '#fff', lineHeight: 1.1, margin: '0 0 16px' }}>
            {ministryName}
          </h1>
          {profile.tagline && (
            <p style={{ fontSize: 'clamp(1rem, 2.5vw, 1.25rem)', color: 'rgba(255,255,255,0.75)', maxWidth: 560, lineHeight: 1.6, margin: '0 0 32px' }}>
              {profile.tagline}
            </p>
          )}
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {hasEvents && (
              <a href="#events" style={{ background: accent, color: '#fff', padding: '12px 24px', borderRadius: 8, fontWeight: 600, fontSize: 14, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <Calendar size={16} /> Upcoming Events
              </a>
            )}
            {hasCampaigns && (
              <a href="#give" style={{ background: 'transparent', color: '#fff', padding: '12px 24px', borderRadius: 8, fontWeight: 600, fontSize: 14, textDecoration: 'none', border: '2px solid rgba(255,255,255,0.4)', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <HandCoins size={16} /> Give Online
              </a>
            )}
          </div>
        </div>
      </section>

      {/* ── ABOUT ── */}
      {hasAbout && (
        <Section id="about" className="bg-white">
          <SectionLabel text="About Us" color={accent} />
          <div style={{ display: 'grid', gridTemplateColumns: profile.pastorPhoto ? '1fr 1fr' : '1fr', gap: 48, alignItems: 'start' }}>
            <div>
              {profile.aboutText && (
                <p style={{ fontSize: 16, lineHeight: 1.8, color: '#374151', marginBottom: 24, whiteSpace: 'pre-wrap' }}>
                  {profile.aboutText}
                </p>
              )}
              {(profile.visionText || profile.missionText) && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  {profile.visionText && (
                    <div style={{ background: '#f9fafb', borderLeft: `4px solid ${accent}`, padding: '16px 20px', borderRadius: '0 8px 8px 0' }}>
                      <p style={{ fontSize: 11, fontWeight: 700, color: accent, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>Vision</p>
                      <p style={{ fontSize: 14, color: '#374151', lineHeight: 1.6 }}>{profile.visionText}</p>
                    </div>
                  )}
                  {profile.missionText && (
                    <div style={{ background: '#f9fafb', borderLeft: `4px solid ${accent}`, padding: '16px 20px', borderRadius: '0 8px 8px 0' }}>
                      <p style={{ fontSize: 11, fontWeight: 700, color: accent, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>Mission</p>
                      <p style={{ fontSize: 14, color: '#374151', lineHeight: 1.6 }}>{profile.missionText}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
            {profile.pastorName && (
              <div style={{ background: '#f9fafb', borderRadius: 16, padding: 28, textAlign: 'center' }}>
                {pastorSrc ? (
                  <img src={pastorSrc} alt={profile.pastorName} style={{ width: 100, height: 100, borderRadius: '50%', objectFit: 'cover', margin: '0 auto 16px', display: 'block', border: `3px solid ${accent}` }} />
                ) : (
                  // Default pastor avatar placeholder
                  <div style={{ width: 100, height: 100, borderRadius: '50%', background: `${accent}22`, border: `3px solid ${accent}`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: 36 }}>
                    👤
                  </div>
                )}
                <p style={{ fontWeight: 700, fontSize: 18, color: '#111', marginBottom: 4 }}>{profile.pastorName}</p>
                <p style={{ fontSize: 12, color: accent, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>Lead Pastor</p>
                {profile.pastorBio && (
                  <p style={{ fontSize: 14, color: '#6b7280', lineHeight: 1.7 }}>{profile.pastorBio}</p>
                )}
              </div>
            )}
          </div>
        </Section>
      )}

      {/* ── SERVICE TIMES ── */}
      {hasServices && (
        <Section id="services" style={{ background: '#f9fafb' }}>
          <SectionLabel text="Join Us" color={accent} />
          <h2 style={{ fontSize: 'clamp(1.5rem, 3vw, 2.25rem)', fontWeight: 800, color: '#111', marginBottom: 32 }}>Service Times</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
            {serviceTimes.map((s, i) => (
              <div key={i} style={{ background: '#fff', borderRadius: 12, padding: 24, border: '1px solid #e5e7eb', borderTop: `4px solid ${accent}` }}>
                <p style={{ fontWeight: 700, fontSize: 16, color: '#111', marginBottom: 8 }}>{s.name}</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#6b7280', fontSize: 14, marginBottom: 4 }}>
                  <Clock size={14} /> {s.day}
                </div>
                <p style={{ fontSize: 18, fontWeight: 700, color: accent, marginBottom: s.location ? 8 : 0 }}>{s.time}</p>
                {s.location && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#9ca3af', fontSize: 13 }}>
                    <MapPin size={13} /> {s.location}
                  </div>
                )}
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* ── EVENTS ── */}
      {hasEvents && (
        <Section id="events">
          <SectionLabel text="What's On" color={accent} />
          <h2 style={{ fontSize: 'clamp(1.5rem, 3vw, 2.25rem)', fontWeight: 800, color: '#111', marginBottom: 32 }}>Upcoming Events</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
            {events.map(ev => (
              <div key={ev.id} style={{ border: '1px solid #e5e7eb', borderRadius: 12, overflow: 'hidden', background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
                {ev.imageUrl && (
                  <img src={ev.imageUrl} alt={ev.title} style={{ width: '100%', height: 160, objectFit: 'cover' }} />
                )}
                <div style={{ padding: 20 }}>
                  <p style={{ fontSize: 12, color: accent, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
                    {formatDate(ev.date)}
                  </p>
                  <h3 style={{ fontWeight: 700, fontSize: 17, color: '#111', marginBottom: 8 }}>{ev.title}</h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#6b7280', fontSize: 13, marginBottom: 12 }}>
                    <MapPin size={13} /> {ev.location}
                  </div>
                  {ev.requiresTicket && (
                    <a
                      href={`${FRONTEND}/events/${ev.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: accent, color: '#fff', padding: '8px 16px', borderRadius: 6, fontSize: 13, fontWeight: 600, textDecoration: 'none' }}
                    >
                      {ev.isFree ? 'Get Free Ticket' : `Get Ticket${ev.ticketPrice ? ` — ${ev.currency} ${ev.ticketPrice.toLocaleString()}` : ''}`}
                      <ExternalLink size={13} />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* ── GIVE ONLINE ── */}
      {hasCampaigns && (
        <Section id="give" style={{ background: '#f9fafb' }}>
          <SectionLabel text="Support the Ministry" color={accent} />
          <h2 style={{ fontSize: 'clamp(1.5rem, 3vw, 2.25rem)', fontWeight: 800, color: '#111', marginBottom: 32 }}>Give Online</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
            {campaigns.map(c => (
              <div key={c.id} style={{ background: '#fff', borderRadius: 12, overflow: 'hidden', border: '1px solid #e5e7eb', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
                {c.imageUrl && (
                  <img src={c.imageUrl} alt={c.name} style={{ width: '100%', height: 140, objectFit: 'cover' }} />
                )}
                <div style={{ padding: 20 }}>
                  <p style={{ fontSize: 11, color: accent, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>
                    {c.category.replace('_', ' ')}
                  </p>
                  <h3 style={{ fontWeight: 700, fontSize: 16, color: '#111', marginBottom: 8 }}>{c.name}</h3>
                  {c.description && (
                    <p style={{ fontSize: 13, color: '#6b7280', lineHeight: 1.6, marginBottom: 16, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {c.description}
                    </p>
                  )}
                  <a
                    href={`${FRONTEND}/giving/${c.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: accent, color: '#fff', padding: '9px 18px', borderRadius: 6, fontSize: 13, fontWeight: 600, textDecoration: 'none' }}
                  >
                    <HandCoins size={14} /> Give Now <ChevronRight size={14} />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* ── CONTACT ── */}
      {hasContact && (
        <Section id="contact">
          <SectionLabel text="Get in Touch" color={accent} />
          <h2 style={{ fontSize: 'clamp(1.5rem, 3vw, 2.25rem)', fontWeight: 800, color: '#111', marginBottom: 32 }}>Contact Us</h2>
          <div style={{ display: 'grid', gridTemplateColumns: profile.address ? '1fr 1fr' : '1fr', gap: 40, alignItems: 'start' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {profile.phone && (
                <a href={`tel:${profile.phone}`} style={{ display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none', color: '#374151' }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: `${accent}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Phone size={18} color={accent} />
                  </div>
                  <div>
                    <p style={{ fontSize: 11, color: '#9ca3af', marginBottom: 2 }}>Phone</p>
                    <p style={{ fontWeight: 600, fontSize: 15 }}>{profile.phone}</p>
                  </div>
                </a>
              )}
              {profile.email && (
                <a href={`mailto:${profile.email}`} style={{ display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none', color: '#374151' }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: `${accent}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Mail size={18} color={accent} />
                  </div>
                  <div>
                    <p style={{ fontSize: 11, color: '#9ca3af', marginBottom: 2 }}>Email</p>
                    <p style={{ fontWeight: 600, fontSize: 15 }}>{profile.email}</p>
                  </div>
                </a>
              )}
              {profile.address && (
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, color: '#374151' }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: `${accent}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <MapPin size={18} color={accent} />
                  </div>
                  <div>
                    <p style={{ fontSize: 11, color: '#9ca3af', marginBottom: 2 }}>Address</p>
                    <p style={{ fontWeight: 600, fontSize: 15 }}>{profile.address}</p>
                  </div>
                </div>
              )}
              {/* Social links */}
              <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                {profile.facebookUrl && (
                  <a href={profile.facebookUrl} target="_blank" rel="noopener noreferrer" style={{ width: 40, height: 40, borderRadius: 10, background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#374151', textDecoration: 'none' }}>
                    <Facebook size={18} />
                  </a>
                )}
                {profile.youtubeUrl && (
                  <a href={profile.youtubeUrl} target="_blank" rel="noopener noreferrer" style={{ width: 40, height: 40, borderRadius: 10, background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#374151', textDecoration: 'none' }}>
                    <Youtube size={18} />
                  </a>
                )}
                {profile.whatsappNumber && (
                  <a href={`https://wa.me/${profile.whatsappNumber.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" style={{ width: 40, height: 40, borderRadius: 10, background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#374151', textDecoration: 'none' }}>
                    <MessageCircle size={18} />
                  </a>
                )}
              </div>
            </div>

            {/* Google Maps embed */}
            {profile.address && (
              <div style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid #e5e7eb', height: 280 }}>
                <iframe
                  title="Church location"
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  src={`https://www.google.com/maps?q=${encodeURIComponent(profile.address)}&output=embed`}
                />
              </div>
            )}
          </div>
        </Section>
      )}

      {/* ── FOOTER ── */}
      <footer style={{ background: '#111', color: '#9ca3af', padding: '32px 24px', textAlign: 'center' }}>
        <p style={{ fontSize: 14, marginBottom: 8 }}>
          <span style={{ color: '#fff', fontWeight: 600 }}>{ministryName}</span>
        </p>
        <p style={{ fontSize: 12 }}>
          Powered by{' '}
          <a href="https://churchcentral.church" style={{ color: accent, textDecoration: 'none' }}>
            ICIMS — Church Central
          </a>
        </p>
      </footer>

    </div>
  );
}
