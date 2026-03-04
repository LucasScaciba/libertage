# Design Document

## Introduction

Este documento descreve o design técnico do Profile Verification System, incluindo arquitetura de dados, APIs, componentes de interface e fluxos de integração.

## Architecture Overview

O sistema segue uma arquitetura de três camadas:
- **Frontend**: Componentes React para upload, dashboard e exibição de badges
- **Backend**: API Routes do Next.js para processamento e validação
- **Storage**: Supabase Storage para imagens + PostgreSQL para metadados

## Database Schema

### Table: profile_verifications

```sql
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

CREATE INDEX idx_profile_verifications_profile_id ON profile_verifications(profile_id);
CREATE INDEX idx_profile_verifications_status ON profile_verifications(status);
CREATE INDEX idx_profile_verifications_expires_at ON profile_verifications(expires_at);
```

### Table: verification_audit_log

```sql
CREATE TABLE verification_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  verification_id UUID NOT NULL REFERENCES profile_verifications(id) ON DELETE CASCADE,
  action VARCHAR(50) NOT NULL,
  actor_id UUID REFERENCES auth.users(id),
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_verification_audit_log_verification_id ON verification_audit_log(verification_id);
CREATE INDEX idx_verification_audit_log_created_at ON verification_audit_log(created_at);
```

### RLS Policies

```sql
-- Professionals can view their own verifications
CREATE POLICY "Users can view own verifications"
  ON profile_verifications FOR SELECT
  USING (profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

-- Professionals can insert their own verifications
CREATE POLICY "Users can insert own verifications"
  ON profile_verifications FOR INSERT
  WITH CHECK (profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

-- Only admins can update verifications
CREATE POLICY "Admins can update verifications"
  ON profile_verifications FOR UPDATE
  USING (EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin'));

-- Public can view verified status (for badges)
CREATE POLICY "Public can view verified status"
  ON profile_verifications FOR SELECT
  USING (status = 'verified' AND expires_at > NOW());
```

## API Endpoints

### POST /api/verification/submit

Submit a new verification request.

**Request:**
```typescript
{
  documentType: 'RG' | 'CNH';
  selfieImage: File; // multipart/form-data
}
```

**Response:**
```typescript
{
  success: boolean;
  verificationId?: string;
  error?: string;
}
```

**Logic:**
1. Validate user authentication
2. Check for existing pending verification
3. Check rate limit (3 per 24h)
4. Validate image format and size
5. Upload image to Supabase Storage (private bucket)
6. Insert verification record with status "pending"
7. Log audit event
8. Return verification ID

### GET /api/verification/status

Get current verification status for authenticated user.

**Response:**
```typescript
{
  status: 'not_verified' | 'pending' | 'verified' | 'rejected' | 'expired';
  verifiedAt?: string;
  expiresAt?: string;
  rejectionReason?: string;
  submittedAt?: string;
}
```

### GET /api/verification/admin/pending

Get all pending verification requests (admin only).

**Response:**
```typescript
{
  verifications: Array<{
    id: string;
    profileId: string;
    profileName: string;
    documentType: 'RG' | 'CNH';
    submittedAt: string;
    imageUrl: string; // signed URL
  }>;
}
```

### POST /api/verification/admin/review

Approve or reject a verification request (admin only).

**Request:**
```typescript
{
  verificationId: string;
  action: 'approve' | 'reject';
  rejectionReason?: string; // required if action is 'reject'
}
```

**Response:**
```typescript
{
  success: boolean;
  error?: string;
}
```

**Logic:**
1. Validate admin authentication
2. Fetch verification record
3. If approve:
   - Set status to "verified"
   - Set verified_at to NOW()
   - Set expires_at to NOW() + 90 days
   - Send approval email
4. If reject:
   - Set status to "rejected"
   - Set rejection_reason
   - Send rejection email
5. Set reviewed_at and reviewed_by
6. Log audit event
7. Schedule image deletion (30 days)

### GET /api/verification/badge/:profileId

Get verification badge status for a profile (public).

**Response:**
```typescript
{
  isVerified: boolean;
  verifiedAt?: string;
}
```

### POST /api/cron/expire-verifications

Cron job to expire verifications (runs daily).

**Logic:**
1. Find all verifications where status = 'verified' AND expires_at < NOW()
2. Update status to 'expired'
3. Send expiry notification emails
4. Log audit events

## Storage Structure

### Supabase Storage Bucket: verification-images (private)

```
verification-images/
  {profile_id}/
    {verification_id}.jpg
```

**Access Control:**
- Private bucket
- Only admins can read
- Signed URLs with 1-hour expiration for admin review
- Auto-delete after 30 days of approval/rejection

## Frontend Components

### VerificationSubmitForm

Location: `app/portal/verification/components/VerificationSubmitForm.tsx`

**Props:** None (uses auth context)

**Features:**
- File upload with preview
- Document type selector (RG/CNH)
- Image validation (format, size, face detection)
- Submit button with loading state
- Error handling

### VerificationStatusCard

Location: `app/portal/verification/components/VerificationStatusCard.tsx`

**Props:**
```typescript
{
  status: VerificationStatus;
  verifiedAt?: Date;
  expiresAt?: Date;
  rejectionReason?: string;
}
```

**Features:**
- Status badge with color coding
- Conditional messaging based on status
- Call-to-action buttons
- Expiry countdown (if verified)

### VerificationBadge

Location: `app/components/verification/VerificationBadge.tsx`

**Props:**
```typescript
{
  isVerified: boolean;
  verifiedAt: Date;
  size?: 'sm' | 'md' | 'lg';
  showTooltip?: boolean;
}
```

**Features:**
- Checkmark icon with shield
- Tooltip with verification date
- Responsive sizing
- Accessible (ARIA labels)

### AdminVerificationReview

Location: `app/admin/verification/components/AdminVerificationReview.tsx`

**Props:** None (fetches data internally)

**Features:**
- List of pending verifications
- Image viewer with zoom
- Approve/Reject buttons
- Rejection reason modal
- Real-time updates

## Services

### verification.service.ts

Location: `lib/services/verification.service.ts`

**Functions:**
```typescript
class VerificationService {
  async submitVerification(profileId: string, documentType: DocumentType, imageFile: File): Promise<string>
  async getVerificationStatus(profileId: string): Promise<VerificationStatus>
  async approveVerification(verificationId: string, adminId: string): Promise<void>
  async rejectVerification(verificationId: string, adminId: string, reason: string): Promise<void>
  async checkVerificationBadge(profileId: string): Promise<boolean>
  async expireVerifications(): Promise<number>
  async checkRateLimit(profileId: string): Promise<boolean>
}
```

### image-validation.service.ts

Location: `lib/services/image-validation.service.ts`

**Functions:**
```typescript
class ImageValidationService {
  async validateImageFormat(file: File): Promise<boolean>
  async validateImageSize(file: File, maxSizeMB: number): Promise<boolean>
  async detectFace(imageBuffer: Buffer): Promise<boolean>
  async compressImage(file: File, maxWidth: number): Promise<Buffer>
}
```

### notification.service.ts

Location: `lib/services/notification.service.ts`

**Functions:**
```typescript
class NotificationService {
  async sendVerificationApproved(profileId: string, verifiedAt: Date): Promise<void>
  async sendVerificationRejected(profileId: string, reason: string): Promise<void>
  async sendVerificationExpiring(profileId: string, expiresAt: Date): Promise<void>
  async sendVerificationExpired(profileId: string): Promise<void>
}
```

## Integration Points

### Catalog Cards

Update `app/components/catalog/ProfileCard.tsx`:
- Fetch verification status
- Display VerificationBadge if verified
- Position badge in top-right corner

### Profile Modal

Update `app/components/profile/ProfileModal.tsx`:
- Fetch verification status
- Display VerificationBadge near profile name
- Show verification date in tooltip

### Public Profile Page

Update `app/perfil/[slug]/PublicProfileClient.tsx`:
- Fetch verification status
- Display VerificationBadge in header
- Show verification date

### Portal Navigation

Add new menu item in `app/portal/layout.tsx`:
- "Verificação de Perfil" link
- Badge indicator if action needed

## Cron Jobs

### Expire Verifications

**Schedule:** Daily at 00:00 UTC

**Endpoint:** `/api/cron/expire-verifications`

**Vercel Cron Config:**
```json
{
  "crons": [{
    "path": "/api/cron/expire-verifications",
    "schedule": "0 0 * * *"
  }]
}
```

### Send Expiry Reminders

**Schedule:** Daily at 09:00 UTC

**Endpoint:** `/api/cron/send-expiry-reminders`

**Logic:**
- Find verifications expiring in 7 days
- Send reminder emails
- Mark as reminded to avoid duplicates

## Security Considerations

1. **Image Storage**: Private bucket with signed URLs
2. **Rate Limiting**: 3 submissions per 24h per user
3. **Admin Authentication**: Verify admin role on all admin endpoints
4. **RLS Policies**: Restrict data access at database level
5. **Image Validation**: Server-side validation of format, size, and content
6. **Audit Logging**: Track all verification actions
7. **Data Retention**: Auto-delete images after 30 days

## Error Handling

### Client-Side Errors
- Invalid image format
- Image too large
- No face detected
- Rate limit exceeded
- Network errors

### Server-Side Errors
- Upload failures
- Database errors
- Email sending failures
- Invalid admin permissions

All errors should be logged and displayed to users with actionable messages.

## Testing Strategy

### Unit Tests
- Service functions
- Image validation logic
- Rate limiting logic
- Date calculations (expiry)

### Integration Tests
- API endpoints
- Database operations
- Storage operations
- Email sending

### E2E Tests
- Submit verification flow
- Admin review flow
- Badge display
- Expiry handling

## Performance Considerations

1. **Image Optimization**: Compress images before upload
2. **Signed URLs**: Cache for 1 hour
3. **Database Indexes**: On profile_id, status, expires_at
4. **Lazy Loading**: Load verification status only when needed
5. **CDN**: Serve badge icons from CDN

## Accessibility

1. **ARIA Labels**: All interactive elements
2. **Keyboard Navigation**: Full keyboard support
3. **Screen Readers**: Descriptive text for badges
4. **Color Contrast**: WCAG AA compliant
5. **Focus Indicators**: Visible focus states

## Correctness Properties

### Property 1: Verification Expiry Invariant
FOR ALL verifications WHERE status = 'verified', expires_at MUST equal verified_at + 90 days

### Property 2: Status Transition Validity
FOR ALL status transitions, the new status MUST be reachable from the current status according to the state machine:
- not_verified → pending
- pending → verified | rejected
- verified → expired
- rejected → pending (new submission)
- expired → pending (new submission)

### Property 3: Single Active Verification
FOR ALL profiles, there MUST be at most one verification with status IN ('pending', 'verified')

### Property 4: Badge Display Condition
A VerificationBadge MUST be displayed IF AND ONLY IF status = 'verified' AND NOW() < expires_at

### Property 5: Rate Limit Enforcement
FOR ALL profiles, the number of verification submissions in any 24-hour window MUST NOT exceed 3

### Property 6: Audit Log Completeness
FOR ALL verification status changes, there MUST exist a corresponding entry in verification_audit_log

### Property 7: Image Deletion After Review
FOR ALL verifications WHERE (status = 'verified' OR status = 'rejected') AND reviewed_at < NOW() - 30 days, the selfie_image_path MUST NOT exist in storage

### Property 8: Admin-Only Review
FOR ALL verification status changes from 'pending' to 'verified' or 'rejected', the reviewed_by user MUST have admin role

## Migration Strategy

1. Create database tables and indexes
2. Create storage bucket with private access
3. Deploy API endpoints
4. Deploy frontend components
5. Add verification links to portal navigation
6. Integrate badges into existing components
7. Set up cron jobs
8. Monitor and iterate
