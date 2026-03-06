// User types
export interface User {
  id: string;
  email: string;
  name: string;
  avatar_url: string | null;
  phone_number: string | null;
  phone_verified_at: Date | null;
  terms_accepted_at: Date | null;
  onboarding_completed: boolean;
  role: "provider" | "moderator" | "admin";
  status: "active" | "suspended" | "banned";
  created_at: Date;
  updated_at: Date;
}

// Profile types
export interface ExternalLink {
  type: "whatsapp" | "telegram" | "instagram" | "website" | "other";
  url: string;
  label: string;
}

export interface PricingPackage {
  name: string;
  price: number;
  currency: string;
  description: string;
}

export interface Profile {
  id: string;
  user_id: string;
  display_name: string;
  slug: string;
  slug_last_changed_at: Date | null;
  category: string;
  short_description: string;
  long_description: string;
  age_attribute: number | null;
  city: string;
  region: string;
  geohash: string;
  latitude: number;
  longitude: number;
  status: "draft" | "published" | "unpublished";
  online_status_updated_at: Date;
  external_links: ExternalLink[];
  pricing_packages: PricingPackage[];
  // Location management fields
  has_no_location: boolean;
  address_cep: string | null;
  address_street: string | null;
  address_neighborhood: string | null;
  address_city: string | null;
  address_state: string | null;
  address_number: string | null;
  created_at: Date;
  updated_at: Date;
}

// Media types
export interface Media {
  id: string;
  profile_id: string;
  type: "photo" | "video";
  storage_path: string;
  public_url: string;
  is_cover: boolean;
  sort_order: number;
  file_size: number;
  created_at: Date;
}

// Availability types
export interface Availability {
  id: string;
  profile_id: string;
  weekday: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  start_time: string;
  end_time: string;
  is_available: boolean;
  created_at: Date;
}

// Boost types
export interface Boost {
  id: string;
  profile_id: string;
  boost_context: string;
  start_time: Date;
  end_time: Date;
  status: "scheduled" | "active" | "expired" | "canceled";
  stripe_payment_intent_id: string | null;
  amount_paid: number;
  created_at: Date;
  updated_at: Date;
}

// Plan types
export interface Plan {
  id: string;
  code: "free" | "premium" | "black";
  name: string;
  price: number;
  currency: string;
  max_photos: number;
  max_videos: number;
  stripe_price_id: string | null;
  created_at: Date;
}

export interface Subscription {
  id: string;
  user_id: string;
  plan_id: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  status: "active" | "past_due" | "canceled" | "incomplete";
  current_period_start: Date | null;
  current_period_end: Date | null;
  created_at: Date;
  updated_at: Date;
}

// Report types
export interface Report {
  id: string;
  profile_id: string;
  reporter_user_id: string | null;
  reporter_fingerprint: string | null;
  reason: "inappropriate_content" | "fake_profile" | "spam" | "other";
  details: string;
  status: "new" | "under_review" | "resolved" | "dismissed";
  reviewed_by: string | null;
  reviewed_at: Date | null;
  created_at: Date;
}

// Audit Log types
export interface AuditLog {
  id: string;
  actor_user_id: string;
  action: "profile_unpublished" | "user_suspended" | "user_banned" | "report_status_updated";
  target_type: "profile" | "user" | "report";
  target_id: string;
  metadata: Record<string, any>;
  created_at: Date;
}

// Story types
export type StoryStatus = 'active' | 'expired' | 'deleted';

export interface Story {
  id: string;
  user_id: string;
  video_url: string;
  thumbnail_url: string | null;
  duration_seconds: number;
  file_size_bytes: number;
  status: StoryStatus;
  created_at: Date;
  expires_at: Date;
  deleted_at: Date | null;
}

export interface StoryWithUser extends Story {
  user: {
    id: string;
    name: string;
    slug: string;
    profile_photo_url: string | null;
  };
}

export interface StoryView {
  id: string;
  story_id: string;
  viewer_id: string | null;
  viewer_ip: string | null;
  viewed_at: Date;
}

export interface StoryReport {
  id: string;
  story_id: string;
  reporter_id: string | null;
  reporter_ip: string | null;
  reason: string;
  status: 'pending' | 'reviewed' | 'dismissed';
  created_at: Date;
  reviewed_at: Date | null;
  reviewed_by: string | null;
}

export interface StoryAnalytics {
  story_id: string;
  view_count: number;
  unique_viewers: number;
  views_by_day: Array<{
    date: string;
    count: number;
  }>;
}

// Verification types
export type VerificationStatus = 'not_verified' | 'pending' | 'verified' | 'rejected' | 'expired';
export type DocumentType = 'RG' | 'CNH';

export interface ProfileVerification {
  id: string;
  profile_id: string;
  status: VerificationStatus;
  document_type: DocumentType;
  selfie_image_path: string;
  submitted_at: Date;
  reviewed_at: Date | null;
  reviewed_by: string | null;
  verified_at: Date | null;
  expires_at: Date | null;
  rejection_reason: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface VerificationAuditLog {
  id: string;
  verification_id: string;
  action: string;
  actor_id: string | null;
  metadata: Record<string, any> | null;
  created_at: Date;
}

export interface VerificationStatusResponse {
  status: VerificationStatus;
  verifiedAt?: Date;
  expiresAt?: Date;
  rejectionReason?: string;
  submittedAt?: Date;
}

export interface VerificationBadgeData {
  isVerified: boolean;
  verifiedAt?: Date;
}

// External Links types (Linktree-style)
export type IconKey = 
  | 'instagram'
  | 'whatsapp'
  | 'linkedin'
  | 'facebook'
  | 'twitter'
  | 'youtube'
  | 'tiktok'
  | 'github'
  | 'link';

export interface ExternalLinkRecord {
  id: string;
  profile_id: string;
  title: string;
  url: string;
  display_order: number;
  icon_key: IconKey;
  created_at: Date;
  updated_at: Date;
}

export interface CreateExternalLinkInput {
  profile_id: string;
  title: string;
  url: string;
}

export interface UpdateExternalLinkInput {
  id: string;
  title?: string;
  url?: string;
}

export interface ReorderExternalLinkInput {
  id: string;
  direction: 'up' | 'down';
}

export interface ExternalLinkWithIcon extends ExternalLinkRecord {
  iconComponent: React.ComponentType;
}

// Location Management types
export interface LocationData {
  hasNoLocation: boolean;
  cep: string | null;
  street: string | null;
  neighborhood: string | null;
  city: string | null;
  state: string | null;
  number: string | null;
}

export interface ViaCepResponse {
  cep: string;
  logradouro: string;
  complemento: string;
  bairro: string;
  localidade: string;
  uf: string;
  ibge: string;
  gia: string;
  ddd: string;
  siafi: string;
  erro?: boolean;
}
