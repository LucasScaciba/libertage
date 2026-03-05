import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    
    // Parse filters
    const filters = {
      gender: searchParams.get("gender") || undefined,
      service: searchParams.get("service") || undefined,
      city: searchParams.get("city") || undefined,
      search: searchParams.get("search") || undefined,
    };

    // Get active stories with profile info
    const { data: stories, error, count } = await supabase
      .from('stories')
      .select(`
        id,
        user_id,
        video_url,
        thumbnail_url,
        created_at,
        expires_at
      `, { count: 'exact' })
      .eq('status', 'active')
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Error fetching catalog stories:', error);
      return NextResponse.json(
        { success: false, error: 'Erro ao buscar stories', details: error },
        { status: 500 }
      );
    }

    // Get unique user IDs
    const userIds = [...new Set(stories?.map(s => s.user_id) || [])];

    // Fetch profiles for these users with filters
    let profilesQuery = supabase
      .from('profiles')
      .select('id, user_id, display_name, slug, gender_identity, service_categories, city, short_description, long_description')
      .in('user_id', userIds)
      .neq('status', 'unpublished');

    // Apply filters to profiles
    if (filters.gender) {
      profilesQuery = profilesQuery.eq('gender_identity', filters.gender);
    }
    
    if (filters.service) {
      profilesQuery = profilesQuery.filter('service_categories', 'cs', `["${filters.service}"]`);
    }
    
    if (filters.city) {
      profilesQuery = profilesQuery.eq('city', filters.city);
    }
    
    if (filters.search) {
      profilesQuery = profilesQuery.or(
        `display_name.ilike.%${filters.search}%,short_description.ilike.%${filters.search}%,long_description.ilike.%${filters.search}%`
      );
    }

    const { data: profiles, error: profilesError } = await profilesQuery;

    if (profilesError) {
      console.error('Error fetching profiles:', profilesError);
      return NextResponse.json(
        { success: false, error: 'Erro ao buscar perfis', details: profilesError },
        { status: 500 }
      );
    }

    // Get profile IDs to fetch cover photos
    const profileIds = profiles?.map(p => p.id) || [];

    // Fetch cover photos for these profiles
    const { data: coverPhotos, error: coverPhotosError } = await supabase
      .from('media')
      .select('profile_id, public_url')
      .in('profile_id', profileIds)
      .eq('type', 'photo')
      .eq('is_cover', true);

    if (coverPhotosError) {
      console.error('Error fetching cover photos:', coverPhotosError);
    }

    // Create maps
    const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);
    const coverPhotoMap = new Map(coverPhotos?.map(m => [m.profile_id, m.public_url]) || []);

    // Transform data to include profile info - only include stories from filtered profiles
    const transformedStories = stories
      ?.filter(story => profileMap.has(story.user_id)) // Only include stories from profiles that match filters
      ?.map(story => {
        const profile = profileMap.get(story.user_id);
        const coverPhoto = profile ? coverPhotoMap.get(profile.id) : null;
        return {
          id: story.id,
          user_id: story.user_id,
          video_url: story.video_url,
          thumbnail_url: story.thumbnail_url,
          created_at: story.created_at,
          expires_at: story.expires_at,
          profile: {
            name: profile?.display_name || 'Usuário',
            avatar_url: coverPhoto || null,
            slug: profile?.slug || ''
          }
        };
      }) || [];

    return NextResponse.json({
      success: true,
      stories: transformedStories,
      total: transformedStories.length
    });

  } catch (error: any) {
    console.error('Error in catalog endpoint:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Erro ao buscar stories' },
      { status: 500 }
    );
  }
}
