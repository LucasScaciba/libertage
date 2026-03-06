import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { LocationData } from "@/types";

/**
 * GET /api/location
 * Retrieve user's location data
 */
export async function GET() {
  try {
    const supabase = await createClient();

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: "Não autenticado", code: "UNAUTHORIZED" },
        { status: 401 }
      );
    }

    // Fetch profile with location data
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("has_no_location, address_cep, address_street, address_neighborhood, address_city, address_state, address_number")
      .eq("user_id", user.id)
      .single();

    if (profileError) {
      console.error("Error fetching profile location:", profileError);
      return NextResponse.json(
        { error: "Erro ao buscar dados. Tente novamente.", code: "DATABASE_ERROR" },
        { status: 500 }
      );
    }

    // Map database fields to LocationData interface
    const locationData: LocationData = {
      hasNoLocation: profile.has_no_location || false,
      cep: profile.address_cep,
      street: profile.address_street,
      neighborhood: profile.address_neighborhood,
      city: profile.address_city,
      state: profile.address_state,
      number: profile.address_number,
    };

    return NextResponse.json(locationData);
  } catch (error) {
    console.error("Unexpected error in GET /api/location:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/location
 * Update user's location data
 */
export async function PATCH(request: Request) {
  try {
    const supabase = await createClient();

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: "Não autenticado", code: "UNAUTHORIZED" },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json() as LocationData;

    // Validation: if hasNoLocation is false, number is required
    if (!body.hasNoLocation && !body.number) {
      return NextResponse.json(
        { 
          error: "Dados inválidos", 
          code: "VALIDATION_ERROR",
          details: {
            field: "number",
            message: "Número é obrigatório quando você possui local de atendimento"
          }
        },
        { status: 400 }
      );
    }

    // Validation: CEP format if provided
    if (body.cep && body.cep.trim() !== '') {
      const cleanCep = body.cep.replace(/\D/g, '');
      if (cleanCep.length !== 8 || !/^\d{8}$/.test(cleanCep)) {
        return NextResponse.json(
          { 
            error: "Dados inválidos", 
            code: "VALIDATION_ERROR",
            details: {
              field: "cep",
              message: "CEP deve conter exatamente 8 dígitos"
            }
          },
          { status: 400 }
        );
      }
    }

    // Validation: state code if provided
    const VALID_STATES = [
      'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO',
      'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI',
      'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
    ];
    
    if (body.state && body.state.trim() !== '') {
      const upperState = body.state.toUpperCase();
      if (!VALID_STATES.includes(upperState)) {
        return NextResponse.json(
          { 
            error: "Dados inválidos", 
            code: "VALIDATION_ERROR",
            details: {
              field: "state",
              message: "Estado inválido"
            }
          },
          { status: 400 }
        );
      }
    }

    // Prepare update data
    const updateData: any = {
      has_no_location: body.hasNoLocation,
    };

    // If hasNoLocation is true, clear all address fields
    if (body.hasNoLocation) {
      updateData.address_cep = null;
      updateData.address_street = null;
      updateData.address_neighborhood = null;
      updateData.address_city = null;
      updateData.address_state = null;
      updateData.address_number = null;
    } else {
      // Otherwise, update with provided values
      updateData.address_cep = body.cep || null;
      updateData.address_street = body.street || null;
      updateData.address_neighborhood = body.neighborhood || null;
      updateData.address_city = body.city || null;
      updateData.address_state = body.state || null;
      updateData.address_number = body.number || null;
    }

    // Update profile
    const { data: updatedProfile, error: updateError } = await supabase
      .from("profiles")
      .update(updateData)
      .eq("user_id", user.id)
      .select("has_no_location, address_cep, address_street, address_neighborhood, address_city, address_state, address_number")
      .single();

    if (updateError) {
      console.error("Error updating profile location:", updateError);
      return NextResponse.json(
        { error: "Erro ao salvar dados. Tente novamente.", code: "DATABASE_ERROR" },
        { status: 500 }
      );
    }

    // Map updated data to LocationData interface
    const locationData: LocationData = {
      hasNoLocation: updatedProfile.has_no_location || false,
      cep: updatedProfile.address_cep,
      street: updatedProfile.address_street,
      neighborhood: updatedProfile.address_neighborhood,
      city: updatedProfile.address_city,
      state: updatedProfile.address_state,
      number: updatedProfile.address_number,
    };

    return NextResponse.json({
      success: true,
      location: locationData,
    });
  } catch (error) {
    console.error("Unexpected error in PATCH /api/location:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}
