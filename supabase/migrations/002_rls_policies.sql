-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE media ENABLE ROW LEVEL SECURITY;
ALTER TABLE availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE features ENABLE ROW LEVEL SECURITY;
ALTER TABLE profile_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE boosts ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can read own data"
  ON users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own data"
  ON users FOR UPDATE
  USING (auth.uid() = id);

-- Profiles policies
CREATE POLICY "Providers can read own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Providers can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Providers can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can read all profiles"
  ON profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Admins can update all profiles"
  ON profiles FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Public can read published profiles"
  ON profiles FOR SELECT
  USING (status = 'published');

-- Media policies
CREATE POLICY "Providers can manage own media"
  ON media FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = media.profile_id
      AND profiles.user_id = auth.uid()
    )
  );

CREATE POLICY "Public can read published media"
  ON media FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = media.profile_id
      AND profiles.status = 'published'
    )
  );

-- Availability policies
CREATE POLICY "Providers can manage own availability"
  ON availability FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = availability.profile_id
      AND profiles.user_id = auth.uid()
    )
  );

CREATE POLICY "Public can read published availability"
  ON availability FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = availability.profile_id
      AND profiles.status = 'published'
    )
  );

-- Features policies (public read)
CREATE POLICY "Anyone can read features"
  ON features FOR SELECT
  USING (true);

-- Profile features policies
CREATE POLICY "Providers can manage own profile features"
  ON profile_features FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = profile_features.profile_id
      AND profiles.user_id = auth.uid()
    )
  );

CREATE POLICY "Public can read published profile features"
  ON profile_features FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = profile_features.profile_id
      AND profiles.status = 'published'
    )
  );

-- Plans policies (public read)
CREATE POLICY "Anyone can read plans"
  ON plans FOR SELECT
  USING (true);

-- Subscriptions policies
CREATE POLICY "Users can read own subscriptions"
  ON subscriptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can read all subscriptions"
  ON subscriptions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Boosts policies
CREATE POLICY "Providers can read own boosts"
  ON boosts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = boosts.profile_id
      AND profiles.user_id = auth.uid()
    )
  );

CREATE POLICY "Public can read active boosts"
  ON boosts FOR SELECT
  USING (status = 'active');

-- Reports policies
CREATE POLICY "Admins and moderators can read reports"
  ON reports FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'moderator')
    )
  );

CREATE POLICY "Admins and moderators can update reports"
  ON reports FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'moderator')
    )
  );

CREATE POLICY "Anyone can insert reports"
  ON reports FOR INSERT
  WITH CHECK (true);

-- Audit logs policies
CREATE POLICY "Admins can read audit logs"
  ON audit_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Analytics events policies
CREATE POLICY "Anyone can insert analytics events"
  ON analytics_events FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Providers can read own analytics"
  ON analytics_events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = analytics_events.profile_id
      AND profiles.user_id = auth.uid()
    )
  );
