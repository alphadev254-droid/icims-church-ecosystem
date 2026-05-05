export interface ServiceTime {
  name: string;
  day: string;
  time: string;
  location?: string;
}

export interface Profile {
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

export interface PublicEvent {
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

export interface PublicCampaign {
  id: string;
  name: string;
  description?: string;
  category: string;
  targetAmount?: number;
  currency: string;
  imageUrl?: string;
  church: { name: string };
}

export interface PageData {
  profile: Profile;
  ministryName: string;
  events: PublicEvent[];
  campaigns: PublicCampaign[];
}

export interface NavLink {
  label: string;
  href: string;
  show: boolean;
}
