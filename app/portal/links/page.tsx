/**
 * External Links Management Page
 * 
 * Portal page for professionals to manage their external links.
 * Integrates the ExternalLinksManager component.
 * 
 * Requirements: 5.1-5.9, 6.1-6.3
 */

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { ExternalLinksManagerClient } from './ExternalLinksManagerClient';

export default async function LinksPage() {
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
    .select('id')
    .eq('user_id', user.id)
    .single();

  if (profileError || !profile) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          Erro ao carregar perfil. Por favor, tente novamente.
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Gerenciar Links</h1>
        <p className="text-gray-600 mt-2">
          Adicione links para suas redes sociais e outros recursos. Eles aparecerão no seu perfil público.
        </p>
      </div>

      <ExternalLinksManagerClient profileId={profile.id} />
    </div>
  );
}
