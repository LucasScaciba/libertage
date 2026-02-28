-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends auth.users)
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  avatar_url TEXT,
  phone_number TEXT,
  phone_verified_at TIMESTAMPTZ,
  terms_accepted_at TIMESTAMPTZ,
  onboarding_completed BOOLEAN DEFAULT FALSE,
  role TEXT DEFAULT 'provider' CHECK (role IN ('provider', 'moderator', 'admin')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'banned')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_status ON users(status);

-- Profiles table
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  slug_last_changed_at TIMESTAMPTZ,
  category TEXT NOT NULL,
  short_description TEXT NOT NULL CHECK (LENGTH(short_description) <= 160),
  long_description TEXT NOT NULL,
  age_attribute INTEGER,
  city TEXT NOT NULL,
  region TEXT NOT NULL,
  geohash TEXT NOT NULL,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'unpublished')),
  online_status_updated_at TIMESTAMPTZ DEFAULT NOW(),
  external_links JSONB DEFAULT '[]',
  pricing_packages JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_profiles_slug ON profiles(slug);
CREATE INDEX idx_profiles_user_id ON profiles(user_id);
CREATE INDEX idx_profiles_status ON profiles(status);
CREATE INDEX idx_profiles_category ON profiles(category);
CREATE INDEX idx_profiles_city ON profiles(city);
CREATE INDEX idx_profiles_region ON profiles(region);
CREATE INDEX idx_profiles_geohash ON profiles(geohash);
CREATE INDEX idx_profiles_updated_at ON profiles(updated_at DESC);

-- Media table
CREATE TABLE media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('photo', 'video')),
  storage_path TEXT NOT NULL,
  public_url TEXT NOT NULL,
  is_cover BOOLEAN DEFAULT FALSE,
  sort_order INTEGER DEFAULT 0,
  file_size INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_media_profile_id ON media(profile_id);
CREATE INDEX idx_media_sort_order ON media(profile_id, sort_order);

-- Availability table
CREATE TABLE availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  weekday INTEGER NOT NULL CHECK (weekday >= 0 AND weekday <= 6),
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  is_available BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_availability_profile_id ON availability(profile_id);

-- Features tables
CREATE TABLE features (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_name TEXT NOT NULL,
  feature_name TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_features_group_name ON features(group_name);

CREATE TABLE profile_features (
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  feature_id UUID NOT NULL REFERENCES features(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (profile_id, feature_id)
);

CREATE INDEX idx_profile_features_profile_id ON profile_features(profile_id);
CREATE INDEX idx_profile_features_feature_id ON profile_features(feature_id);

-- Plans table
CREATE TABLE plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE CHECK (code IN ('free', 'premium', 'black')),
  name TEXT NOT NULL,
  price INTEGER NOT NULL,
  currency TEXT DEFAULT 'BRL',
  max_photos INTEGER NOT NULL,
  max_videos INTEGER NOT NULL,
  stripe_price_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_plans_code ON plans(code);

-- Subscriptions table
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES plans(id),
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'past_due', 'canceled', 'incomplete')),
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_subscriptions_stripe_customer_id ON subscriptions(stripe_customer_id);

-- Boosts table
CREATE TABLE boosts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  boost_context TEXT NOT NULL,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'active', 'expired', 'canceled')),
  stripe_payment_intent_id TEXT,
  amount_paid INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_boosts_profile_id ON boosts(profile_id);
CREATE INDEX idx_boosts_status ON boosts(status);
CREATE INDEX idx_boosts_context_time ON boosts(boost_context, start_time, end_time);
CREATE INDEX idx_boosts_start_time ON boosts(start_time);
CREATE INDEX idx_boosts_end_time ON boosts(end_time);

-- Reports table
CREATE TABLE reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reporter_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  reporter_fingerprint TEXT,
  reason TEXT NOT NULL CHECK (reason IN ('inappropriate_content', 'fake_profile', 'spam', 'other')),
  details TEXT NOT NULL,
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'under_review', 'resolved', 'dismissed')),
  reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_reports_profile_id ON reports(profile_id);
CREATE INDEX idx_reports_status ON reports(status);
CREATE INDEX idx_reports_created_at ON reports(created_at DESC);
CREATE INDEX idx_reports_fingerprint ON reports(reporter_fingerprint);

-- Audit logs table
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK (action IN ('profile_unpublished', 'user_suspended', 'user_banned', 'report_status_updated')),
  target_type TEXT NOT NULL CHECK (target_type IN ('profile', 'user', 'report')),
  target_id UUID NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_actor ON audit_logs(actor_user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- Analytics events table
CREATE TABLE analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('visit', 'contact_click')),
  contact_method TEXT,
  visitor_fingerprint TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_analytics_profile_id ON analytics_events(profile_id);
CREATE INDEX idx_analytics_event_type ON analytics_events(event_type);
CREATE INDEX idx_analytics_created_at ON analytics_events(created_at DESC);
CREATE INDEX idx_analytics_profile_created ON analytics_events(profile_id, created_at DESC);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_boosts_updated_at BEFORE UPDATE ON boosts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
