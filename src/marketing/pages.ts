import { createElement, lazy, type ComponentType } from 'react';
import { appMetadata, SITE_DESCRIPTION, type PageMetadata } from './seo';
import { featurePath, featureTopics } from './topic-content';

type PageLoader = () => Promise<{ default: ComponentType }>;
type PublicPage = PageMetadata & { path: string; load: PageLoader; Component: ComponentType };

function publicPage(path: string, label: string, title: string, description: string, load: PageLoader, options?: Pick<PageMetadata, 'breadcrumb' | 'index'>): PublicPage {
  return { path, label, title: `${title} | ICIMS`, description, load, Component: lazy(load), ...options };
}

export const publicPages = [
  publicPage('/', 'Home', 'Church Management Software', SITE_DESCRIPTION, () => import('@/pages/Index')),
  publicPage('/features', 'Features', 'Church Management Software Features', 'Explore the ICIMS catalogue for children’s records, discipleship, church calendars, check-in, events, giving, asset and facility booking, and reports.', () => import('@/pages/Features')),
  publicPage('/pricing', 'Pricing', 'Church Management Software Pricing', 'Compare ICIMS plans for your church or multi-branch ministry. Review available features and package pricing for your market.', () => import('@/pages/Pricing')),
  publicPage('/about', 'About', 'About ICIMS and Church Central', 'Learn why ICIMS was built and how it helps local churches and multi-branch ministries manage people, operations and reporting.', () => import('@/pages/About')),
  publicPage('/contact', 'Contact', 'Contact ICIMS Support or Book a Demo', 'Contact ICIMS for onboarding, support and pricing. Get the Church Central email and phone details or request a software demo.', () => import('@/pages/Contact')),
  publicPage('/referrals', 'Marketer program', 'Church Central Marketer Program', 'Learn how to introduce churches to ICIMS, share your referral link and earn commission on eligible package payments.', () => import('@/pages/Referrals')),
  publicPage('/terms', 'Terms', 'Terms and Conditions', 'Read the terms for using the ICIMS church management platform.', () => import('@/pages/Terms'), { index: false }),
  publicPage('/terms/marketers', 'Marketer terms', 'Marketer Terms and Conditions', 'Read the terms for participating in the ICIMS Marketer Program.', () => import('@/pages/MarketerTerms'), { index: false }),
  publicPage('/privacy', 'Privacy policy', 'Privacy Policy', 'Read the ICIMS privacy policy and how the platform handles personal information.', () => import('@/pages/Privacy'), { index: false }),
  ...featureTopics.map(topic => publicPage(featurePath(topic.slug), topic.label, topic.heading, topic.description, async () => {
    const { default: FeaturePage } = await import('./FeaturePage');
    return { default: () => createElement(FeaturePage, { topic }) };
  }, { breadcrumb: { title: 'Features', path: '/features' } })),
];

export function getPublicPage(pathname: string) {
  const path = pathname.replace(/\/+$/, '').toLowerCase() || '/';
  return publicPages.find(page => page.path === path);
}

const utilityPath = /^\/(dashboard|admin|login|register|verify-email|forgot-password|reset-password|payment|invoice|attendance|check-in)(\/|$)/i;

export function getRouteMetadata(pathname: string): PageMetadata {
  return getPublicPage(pathname) ?? { ...appMetadata, index: !utilityPath.test(pathname) };
}
