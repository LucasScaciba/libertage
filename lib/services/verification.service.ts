import { createClient } from '@/lib/supabase/server';
import type { ProfileVerification, VerificationStatus, DocumentType } from '@/types';

export class VerificationService {
  /**
   * Submit a new verification request
   */
  static async submitVerification(
    profileId: string,
    documentType: DocumentType,
    imageFile: File
  ): Promise<string> {
    const supabase = await createClient();

    // Check for existing pending verification
    const { data: existing } = await supabase
      .from('profile_verifications')
      .select('id, status')
      .eq('profile_id', profileId)
      .eq('status', 'pending')
      .single();

    if (existing) {
      throw new Error('Você já possui uma solicitação de verificação pendente');
    }

    // Check rate limit
    const canSubmit = await this.checkRateLimit(profileId);
    if (!canSubmit) {
      throw new Error('Limite de submissões atingido. Tente novamente em 24 horas');
    }

    // Upload image to storage
    const imagePath = `${profileId}/${crypto.randomUUID()}.jpg`;
    const { error: uploadError } = await supabase.storage
      .from('verification-images')
      .upload(imagePath, imageFile, {
        contentType: imageFile.type,
        upsert: false,
      });

    if (uploadError) {
      throw new Error('Erro ao fazer upload da imagem: ' + uploadError.message);
    }

    // Create verification record
    const { data: verification, error: insertError } = await supabase
      .from('profile_verifications')
      .insert({
        profile_id: profileId,
        status: 'pending',
        document_type: documentType,
        selfie_image_path: imagePath,
      })
      .select()
      .single();

    if (insertError) {
      // Cleanup uploaded image
      await supabase.storage.from('verification-images').remove([imagePath]);
      throw new Error('Erro ao criar solicitação de verificação: ' + insertError.message);
    }

    return verification.id;
  }

  /**
   * Get verification status for a profile
   */
  static async getVerificationStatus(profileId: string): Promise<ProfileVerification | null> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('profile_verifications')
      .select('*')
      .eq('profile_id', profileId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new Error('Erro ao buscar status de verificação: ' + error.message);
    }

    return data as ProfileVerification | null;
  }

  /**
   * Approve a verification request
   */
  static async approveVerification(verificationId: string, adminId: string): Promise<void> {
    const supabase = await createClient();

    const verifiedAt = new Date();
    const expiresAt = new Date(verifiedAt);
    expiresAt.setDate(expiresAt.getDate() + 90); // 90 days from now

    const { error } = await supabase
      .from('profile_verifications')
      .update({
        status: 'verified',
        verified_at: verifiedAt.toISOString(),
        expires_at: expiresAt.toISOString(),
        reviewed_at: new Date().toISOString(),
        reviewed_by: adminId,
      })
      .eq('id', verificationId);

    if (error) {
      throw new Error('Erro ao aprovar verificação: ' + error.message);
    }

    // Schedule image deletion (30 days from now)
    // This would be handled by a separate cleanup job
  }

  /**
   * Reject a verification request
   */
  static async rejectVerification(
    verificationId: string,
    adminId: string,
    reason: string
  ): Promise<void> {
    const supabase = await createClient();

    const { error } = await supabase
      .from('profile_verifications')
      .update({
        status: 'rejected',
        rejection_reason: reason,
        reviewed_at: new Date().toISOString(),
        reviewed_by: adminId,
      })
      .eq('id', verificationId);

    if (error) {
      throw new Error('Erro ao rejeitar verificação: ' + error.message);
    }
  }

  /**
   * Check if profile has a valid verification badge
   */
  static async checkVerificationBadge(profileId: string): Promise<boolean> {
    const supabase = await createClient();

    const { data } = await supabase
      .from('profile_verifications')
      .select('status, expires_at')
      .eq('profile_id', profileId)
      .eq('status', 'verified')
      .single();

    if (!data) return false;

    const now = new Date();
    const expiresAt = new Date(data.expires_at);

    return expiresAt > now;
  }

  /**
   * Expire verifications that have passed their expiry date
   */
  static async expireVerifications(): Promise<number> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('profile_verifications')
      .update({ status: 'expired' })
      .eq('status', 'verified')
      .lt('expires_at', new Date().toISOString())
      .select();

    if (error) {
      throw new Error('Erro ao expirar verificações: ' + error.message);
    }

    return data?.length || 0;
  }

  /**
   * Check rate limit for verification submissions
   */
  static async checkRateLimit(profileId: string): Promise<boolean> {
    const supabase = await createClient();

    const twentyFourHoursAgo = new Date();
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

    const { data, error } = await supabase
      .from('profile_verifications')
      .select('id')
      .eq('profile_id', profileId)
      .gte('submitted_at', twentyFourHoursAgo.toISOString());

    if (error) {
      throw new Error('Erro ao verificar limite de submissões: ' + error.message);
    }

    return (data?.length || 0) < 3;
  }

  /**
   * Get pending verifications for admin review
   */
  static async getPendingVerifications(): Promise<any[]> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('profile_verifications')
      .select(`
        *,
        profiles:profile_id (
          id,
          display_name,
          slug
        )
      `)
      .eq('status', 'pending')
      .order('submitted_at', { ascending: true });

    if (error) {
      throw new Error('Erro ao buscar verificações pendentes: ' + error.message);
    }

    // Generate signed URLs for images
    const verificationsWithUrls = await Promise.all(
      (data || []).map(async (verification) => {
        const { data: signedUrl } = await supabase.storage
          .from('verification-images')
          .createSignedUrl(verification.selfie_image_path, 3600); // 1 hour

        return {
          ...verification,
          imageUrl: signedUrl?.signedUrl || null,
        };
      })
    );

    return verificationsWithUrls;
  }

  /**
   * Get verifications expiring soon (for reminder emails)
   */
  static async getExpiringSoon(daysBeforeExpiry: number = 7): Promise<ProfileVerification[]> {
    const supabase = await createClient();

    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + daysBeforeExpiry);

    const { data, error } = await supabase
      .from('profile_verifications')
      .select('*')
      .eq('status', 'verified')
      .lte('expires_at', targetDate.toISOString())
      .gte('expires_at', new Date().toISOString());

    if (error) {
      throw new Error('Erro ao buscar verificações expirando: ' + error.message);
    }

    return data as ProfileVerification[];
  }
}
