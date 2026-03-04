import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

interface CharacteristicsData {
  // Services
  payment_methods?: string[];
  service_locations?: string[];
  clientele?: string[];
  languages?: string[];
  
  // Physical
  height?: number;
  weight?: number;
  shoe_size?: number;
  ethnicity?: string;
  body_type?: string;
  hair_color?: string;
  eye_color?: string;
  breast_type?: string;
  breast_size?: string;
  body_hair?: string;
  buttocks_type?: string;
  buttocks_size?: string;
}

// Extract characteristics from profile data
function extractCharacteristics(profile: any): CharacteristicsData {
  const selectedFeatures = profile.selected_features || [];
  
  // Helper to extract features by category
  const extractByCategory = (keywords: string[]): string[] => {
    return selectedFeatures.filter((feature: string) => 
      keywords.some(keyword => feature.toLowerCase().includes(keyword.toLowerCase()))
    );
  };
  
  return {
    // Services - extract from selected_features
    payment_methods: extractByCategory(['dinheiro', 'pix', 'cartão', 'débito', 'crédito']),
    service_locations: extractByCategory(['local', 'hotel', 'motel', 'residência']),
    clientele: extractByCategory(['homens', 'mulheres', 'casais']),
    languages: extractByCategory(['português', 'inglês', 'espanhol', 'francês']),
    
    // Physical - from direct columns and selected_features
    height: profile.height,
    weight: profile.weight,
    shoe_size: profile.shoe_size,
    ethnicity: selectedFeatures.find((f: string) => ['Branca', 'Negra', 'Parda', 'Asiática', 'Indígena'].includes(f)),
    body_type: selectedFeatures.find((f: string) => ['Magra', 'Atlética', 'Curvilínea', 'Plus Size'].includes(f)),
    hair_color: selectedFeatures.find((f: string) => ['Loiro', 'Moreno', 'Ruivo', 'Preto', 'Grisalho'].includes(f)),
    eye_color: selectedFeatures.find((f: string) => ['Castanhos', 'Azuis', 'Verdes', 'Pretos'].includes(f)),
    breast_type: selectedFeatures.find((f: string) => ['Natural', 'Silicone'].includes(f)),
    breast_size: selectedFeatures.find((f: string) => ['Pequeno', 'Médio', 'Grande'].includes(f)),
    body_hair: selectedFeatures.find((f: string) => ['Depilada', 'Aparada', 'Natural'].includes(f)),
    buttocks_type: profile.buttocks_type,
    buttocks_size: profile.buttocks_size,
  };
}

// GET - Retrieve user's characteristics
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }
    
    // Get user's profile
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", user.id)
      .single();
      
    if (profileError || !profile) {
      return NextResponse.json({ error: "Perfil não encontrado" }, { status: 404 });
    }
    
    // Extract characteristics
    const characteristics = extractCharacteristics(profile);
    
    return NextResponse.json({ characteristics });
  } catch (error: any) {
    console.error("Error fetching characteristics:", error);
    return NextResponse.json(
      { error: error.message || "Erro ao buscar características" },
      { status: 500 }
    );
  }
}

// PUT - Update user's characteristics
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }
    
    // Parse request body
    const body: CharacteristicsData = await request.json();
    
    // Validate numeric ranges
    const errors: string[] = [];
    
    if (body.height && (body.height < 140 || body.height > 200)) {
      errors.push("Altura deve estar entre 140 e 200 cm");
    }
    
    if (body.weight && (body.weight < 40 || body.weight > 150)) {
      errors.push("Peso deve estar entre 40 e 150 kg");
    }
    
    if (body.shoe_size && (body.shoe_size < 33 || body.shoe_size > 44)) {
      errors.push("Tamanho do pé deve estar entre 33 e 44");
    }
    
    if (errors.length > 0) {
      return NextResponse.json(
        { error: "Validação falhou", details: errors },
        { status: 400 }
      );
    }
    
    // Get user's profile
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, selected_features")
      .eq("user_id", user.id)
      .single();
      
    if (profileError || !profile) {
      return NextResponse.json({ error: "Perfil não encontrado" }, { status: 404 });
    }
    
    // Build updated selected_features array
    const currentFeatures = profile.selected_features || [];
    
    // Remove old characteristics from selected_features
    const featuresToKeep = currentFeatures.filter((f: string) => {
      // Keep service categories (they're in a separate field now)
      if (['Massagem', 'Acompanhante', 'Chamada de vídeo'].includes(f)) return true;
      
      // Remove old characteristics that we're updating
      const characteristicKeywords = [
        'dinheiro', 'pix', 'cartão', 'débito', 'crédito',
        'local', 'hotel', 'motel', 'residência',
        'homens', 'mulheres', 'casais',
        'português', 'inglês', 'espanhol', 'francês',
        'Branca', 'Negra', 'Parda', 'Asiática', 'Indígena',
        'Magra', 'Atlética', 'Curvilínea', 'Plus Size',
        'Loiro', 'Moreno', 'Ruivo', 'Preto', 'Grisalho',
        'Castanhos', 'Azuis', 'Verdes', 'Pretos',
        'Natural', 'Silicone',
        'Pequeno', 'Médio', 'Grande',
        'Depilada', 'Aparada', 'Natural'
      ];
      
      return !characteristicKeywords.some(keyword => 
        f.toLowerCase().includes(keyword.toLowerCase())
      );
    });
    
    // Add new characteristics
    const newFeatures = [
      ...(body.payment_methods || []),
      ...(body.service_locations || []),
      ...(body.clientele || []),
      ...(body.languages || []),
      body.ethnicity,
      body.body_type,
      body.hair_color,
      body.eye_color,
      body.breast_type,
      body.breast_size,
      body.body_hair,
    ].filter(Boolean); // Remove undefined/null values
    
    const updatedFeatures = [...featuresToKeep, ...newFeatures];
    
    // Update profile
    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        selected_features: updatedFeatures,
        height: body.height,
        weight: body.weight,
        shoe_size: body.shoe_size,
        buttocks_type: body.buttocks_type,
        buttocks_size: body.buttocks_size,
      })
      .eq("id", profile.id);
      
    if (updateError) {
      throw updateError;
    }
    
    return NextResponse.json({ success: true, characteristics: body });
  } catch (error: any) {
    console.error("Error updating characteristics:", error);
    return NextResponse.json(
      { error: error.message || "Erro ao atualizar características" },
      { status: 500 }
    );
  }
}
