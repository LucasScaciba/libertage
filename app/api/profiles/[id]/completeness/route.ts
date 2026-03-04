import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { ProfileCompletenessService } from "@/lib/services/profile-completeness.service";

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

/**
 * GET /api/profiles/[id]/completeness
 * 
 * Verifica a completude do perfil para exibição no catálogo
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Não autenticado" },
        { status: 401 }
      );
    }

    // Verify profile ownership
    const { data: profile } = await supabase
      .from("profiles")
      .select("user_id")
      .eq("id", id)
      .single();

    if (!profile || profile.user_id !== user.id) {
      return NextResponse.json(
        { error: "Perfil não encontrado ou sem permissão" },
        { status: 404 }
      );
    }

    // Check completeness
    const completeness = await ProfileCompletenessService.checkProfileCompleteness(id);

    return NextResponse.json({
      completeness,
    });
  } catch (error: any) {
    console.error("Error checking profile completeness:", error);
    return NextResponse.json(
      { error: error.message || "Erro ao verificar completude do perfil" },
      { status: 500 }
    );
  }
}
