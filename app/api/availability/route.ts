import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

// GET - Fetch availability for a profile
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const profileId = searchParams.get("profileId");

    if (!profileId) {
      return NextResponse.json(
        { error: "Profile ID é obrigatório" },
        { status: 400 }
      );
    }

    // Verify user owns this profile
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json(
        { error: "Não autenticado" },
        { status: 401 }
      );
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, user_id")
      .eq("id", profileId)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: "Perfil não encontrado" },
        { status: 404 }
      );
    }

    if (profile.user_id !== user.id) {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 403 }
      );
    }

    // Fetch availability from the availability table
    const { data: availability, error: availabilityError } = await supabase
      .from("availability")
      .select("*")
      .eq("profile_id", profileId)
      .order("weekday", { ascending: true })
      .order("start_time", { ascending: true });

    if (availabilityError) {
      throw availabilityError;
    }

    return NextResponse.json({
      availability: availability || [],
    });
  } catch (error: any) {
    console.error("Error fetching availability:", error);
    return NextResponse.json(
      { error: error.message || "Erro ao buscar horários" },
      { status: 500 }
    );
  }
}

// POST - Save availability for a profile
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();
    const { profileId, availability } = body;

    if (!profileId || !availability) {
      return NextResponse.json(
        { error: "Profile ID e availability são obrigatórios" },
        { status: 400 }
      );
    }

    // Verify user owns this profile
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json(
        { error: "Não autenticado" },
        { status: 401 }
      );
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, user_id")
      .eq("id", profileId)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: "Perfil não encontrado" },
        { status: 404 }
      );
    }

    if (profile.user_id !== user.id) {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 403 }
      );
    }

    // Delete existing availability slots for this profile
    const { error: deleteError } = await supabase
      .from("availability")
      .delete()
      .eq("profile_id", profileId);

    if (deleteError) {
      throw deleteError;
    }

    // Insert new availability slots (only if there are any)
    if (availability.length > 0) {
      const slotsToInsert = availability.map((slot: any) => ({
        profile_id: profileId,
        weekday: slot.weekday,
        start_time: slot.start_time,
        end_time: slot.end_time,
        is_available: slot.is_available !== false, // Default to true
      }));

      const { error: insertError } = await supabase
        .from("availability")
        .insert(slotsToInsert);

      if (insertError) {
        throw insertError;
      }
    }

    // Fetch updated availability
    const { data: updatedAvailability } = await supabase
      .from("availability")
      .select("*")
      .eq("profile_id", profileId)
      .order("weekday", { ascending: true })
      .order("start_time", { ascending: true });

    return NextResponse.json({
      success: true,
      availability: updatedAvailability || [],
    });
  } catch (error: any) {
    console.error("Error saving availability:", error);
    return NextResponse.json(
      { error: error.message || "Erro ao salvar horários" },
      { status: 500 }
    );
  }
}
