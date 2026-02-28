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
