import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { VerificationService } from '@/lib/services/verification.service';
import { ImageValidationService } from '@/lib/services/image-validation.service';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    // Get user's profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: 'Perfil não encontrado' }, { status: 404 });
    }

    // Parse form data
    const formData = await request.formData();
    const documentType = formData.get('documentType') as string;
    const selfieImage = formData.get('selfieImage') as File;

    // Validate inputs
    if (!documentType || !['RG', 'CNH'].includes(documentType)) {
      return NextResponse.json(
        { error: 'Tipo de documento inválido. Use RG ou CNH.' },
        { status: 400 }
      );
    }

    if (!selfieImage || !(selfieImage instanceof File)) {
      return NextResponse.json({ error: 'Imagem da selfie é obrigatória' }, { status: 400 });
    }

    // Validate image
    const validation = await ImageValidationService.validateImage(selfieImage);
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.errors.join(', ') },
        { status: 400 }
      );
    }

    // Compress image before upload
    const compressedBuffer = await ImageValidationService.compressImage(selfieImage);
    const compressedFile = new File([compressedBuffer], selfieImage.name, {
      type: 'image/jpeg',
    });

    // Submit verification
    const verificationId = await VerificationService.submitVerification(
      profile.id,
      documentType as 'RG' | 'CNH',
      compressedFile
    );

    return NextResponse.json({
      success: true,
      verificationId,
      message: 'Solicitação de verificação enviada com sucesso',
    });
  } catch (error: any) {
    console.error('Error submitting verification:', error);
    return NextResponse.json(
      { error: error.message || 'Erro ao enviar solicitação de verificação' },
      { status: 500 }
    );
  }
}
