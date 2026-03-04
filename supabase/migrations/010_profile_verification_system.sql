-- Profile Verification System Migration

-- Create profile_verifications table
CREATE TABLE profile_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL CHECK (status IN ('not_verified', 'pending', 'verified', 'rejected', 'expired')),
  document_type VARCHAR(10) NOT NULL CHECK (document_type IN ('RG', 'CNH')),
  selfie_image_path TEXT NOT NULL,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES auth.users(id),
  verified_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create verification_audit_log table
CREATE TABLE verification_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  verification_id UUID NOT NULL REFERENCES profile_verifications(id) ON DELETE CASCADE,
  action VARCHAR(50) NOT NULL,
  actor_id UUID REFERENCES auth.users(id),
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_profile_verifications_profile_id ON profile_verifications(profile_id);
CREATE INDEX idx_profile_verifications_status ON profile_verifications(status);
CREATE INDEX idx_profile_verifications_expires_at ON profile_verifications(expires_at);
CREATE INDEX idx_verification_audit_log_verification_id ON verification_audit_log(verification_id);
CREATE INDEX idx_verification_audit_log_created_at ON verification_audit_log(created_at);

-- Enable RLS
ALTER TABLE profile_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_audit_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profile_verifications

-- Users can view their own verifications
CREATE POLICY "Users can view own verifications"
  ON profile_verifications FOR SELECT
  USING (profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

-- Users can insert their own verifications
CREATE POLICY "Users can insert own verifications"
  ON profile_verifications FOR INSERT
  WITH CHECK (profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

-- Admins can view all verifications
CREATE POLICY "Admins can view all verifications"
  ON profile_verifications FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin'));

-- Admins can update verifications
CREATE POLICY "Admins can update verifications"
  ON profile_verifications FOR UPDATE
  USING (EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin'));

-- Public can view verified status (for badges)
CREATE POLICY "Public can view verified status"
  ON profile_verifications FOR SELECT
  USING (status = 'verified' AND expires_at > NOW());

-- RLS Policies for verification_audit_log

-- Admins can view audit logs
CREATE POLICY "Admins can view audit logs"
  ON verification_audit_log FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin'));

-- System can insert audit logs
CREATE POLICY "System can insert audit logs"
  ON verification_audit_log FOR INSERT
  WITH CHECK (true);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_verification_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER update_profile_verifications_updated_at
  BEFORE UPDATE ON profile_verifications
  FOR EACH ROW
  EXECUTE FUNCTION update_verification_updated_at();

-- Create function to log verification actions
CREATE OR REPLACE FUNCTION log_verification_action()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO verification_audit_log (verification_id, action, actor_id, metadata)
    VALUES (NEW.id, 'submitted', auth.uid(), jsonb_build_object('document_type', NEW.document_type));
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.status != NEW.status THEN
      INSERT INTO verification_audit_log (verification_id, action, actor_id, metadata)
      VALUES (
        NEW.id,
        CASE NEW.status
          WHEN 'verified' THEN 'approved'
          WHEN 'rejected' THEN 'rejected'
          WHEN 'expired' THEN 'expired'
          ELSE 'status_changed'
        END,
        NEW.reviewed_by,
        jsonb_build_object(
          'old_status', OLD.status,
          'new_status', NEW.status,
          'rejection_reason', NEW.rejection_reason
        )
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for audit logging
CREATE TRIGGER log_verification_actions
  AFTER INSERT OR UPDATE ON profile_verifications
  FOR EACH ROW
  EXECUTE FUNCTION log_verification_action();

-- Add comment
COMMENT ON TABLE profile_verifications IS 'Stores profile verification requests and their status';
COMMENT ON TABLE verification_audit_log IS 'Audit trail for all verification actions';
