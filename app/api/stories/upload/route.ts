import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { VideoUploadService } from '@/lib/services/video-upload.service';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Não autenticado' },
        { status: 401 }
      );
    }

    // Get form data
    const formData = await request.formData();
    const videoFile = formData.get('video') as File;

    if (!videoFile) {
      return NextResponse.json(
        { success: false, error: 'Nenhum arquivo de vídeo fornecido' },
        { status: 400 }
      );
    }

    // Validate video
    const validation = await VideoUploadService.validateVideo(videoFile);
    if (!validation.valid) {
      return NextResponse.json(
        { success: false, error: validation.error },
        { status: 400 }
      );
    }

    // Upload video
    const uploadResult = await VideoUploadService.uploadVideo(videoFile, user.id);

    return NextResponse.json({
      success: true,
      video_url: uploadResult.video_url,
      thumbnail_url: uploadResult.thumbnail_url,
      duration_seconds: uploadResult.duration_seconds,
      file_size_bytes: uploadResult.file_size_bytes
    });

  } catch (error: any) {
    console.error('Error uploading video:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Erro ao fazer upload' },
      { status: 500 }
    );
  }
}
