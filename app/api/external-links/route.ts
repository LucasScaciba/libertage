import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { ExternalLinkService } from '@/lib/services/external-link.service';

/**
 * POST /api/external-links
 * Create a new external link
 * 
 * Requirements: 5.2, 5.3, 9.1, 9.2, 9.3, 9.4, 9.5
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Não autenticado' },
        { status: 401 }
      );
    }

    // Get user's profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { success: false, error: 'Perfil não encontrado' },
        { status: 404 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { title, url } = body;

    // Validate required fields
    if (!title || !url) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Título e URL são obrigatórios' 
        },
        { status: 400 }
      );
    }

    // Create link using service
    const link = await ExternalLinkService.createLink({
      profile_id: profile.id,
      title,
      url,
    });

    return NextResponse.json(
      { success: true, data: link },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error creating external link:', error);
    
    // Return user-friendly error message
    const statusCode = error.message.includes('limite') ? 403 : 
                       error.message.includes('inválid') ? 400 : 500;
    
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Erro ao criar link. Verifique sua conexão e tente novamente.' 
      },
      { status: statusCode }
    );
  }
}

/**
 * GET /api/external-links?profileId=xxx
 * Get all links for a profile
 * 
 * - For authenticated users: Returns their own links regardless of publish status
 * - For public access: Only returns links for published profiles
 * 
 * Requirements: 7.1, 10.1
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const profileId = searchParams.get('profileId');

    if (!profileId) {
      return NextResponse.json(
        { success: false, error: 'profileId é obrigatório' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Check if user is authenticated
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // If authenticated, check if this is their own profile
    let isOwnProfile = false;
    if (user) {
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .eq('id', profileId)
        .single();
      
      isOwnProfile = !!userProfile;
    }

    // If not own profile, check if profile is published (public access)
    if (!isOwnProfile) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('is_published')
        .eq('id', profileId)
        .single();

      if (!profile || !profile.is_published) {
        return NextResponse.json(
          { success: false, error: 'Perfil não encontrado ou não publicado' },
          { status: 404 }
        );
      }
    }

    // Get links for profile
    const links = await ExternalLinkService.getLinksForProfile(profileId);

    return NextResponse.json(
      { success: true, data: links },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error fetching external links:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Erro ao buscar links. Tente novamente em alguns instantes.' 
      },
      { status: 500 }
    );
  }
}
