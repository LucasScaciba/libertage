/**
 * Media Management Page
 * 
 * Unified page for managing photos, videos, and stories.
 * Provides tabs for easy navigation between media types.
 */

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { MediaManagerClient } from './MediaManagerClient';

export default async function MediaPage() {
  const supabase = await createClient();

  // Get authenticated user
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect('/login');
  }

  // Get user's profile
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, user_id')
    .eq('user_id', user.id)
    .single();

  if (profileError || !profile) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          Erro ao carregar perfil. Por favor, tente novamente.
        </div>
      </div>
    );
  }

  // Get subscription info
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('*, plan:plans(*)')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .single();

  const planCode = subscription?.plan?.code || 'free';

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Minha Mídia</h1>
        <p className="text-gray-600 mt-2">
          Gerencie suas fotos, vídeos e stories em um só lugar.
        </p>
      </div>

      <MediaManagerClient 
        userId={user.id}
        profileId={profile.id}
        planCode={planCode}
      />
    </div>
  );
}
