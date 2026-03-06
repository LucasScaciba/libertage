import { NextResponse } from "next/server";
import { LocationService } from "@/lib/services/location.service";

/**
 * GET /api/location/cep/:cep
 * Proxy to ViaCEP API for address lookup
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ cep: string }> }
) {
  try {
    const { cep } = await params;

    // Validate CEP format
    if (!LocationService.validateCep(cep)) {
      return NextResponse.json(
        { 
          error: "CEP inválido", 
          code: "INVALID_FORMAT",
          details: {
            cep,
            message: "CEP deve conter exatamente 8 dígitos numéricos"
          }
        },
        { status: 400 }
      );
    }

    // Fetch address from ViaCEP
    try {
      const addressData = await LocationService.fetchAddressByCep(cep);
      return NextResponse.json(addressData);
    } catch (error) {
      if (error instanceof Error) {
        // Handle specific ViaCEP errors
        if (error.message.includes('CEP não encontrado')) {
          return NextResponse.json(
            { 
              error: "CEP não encontrado", 
              code: "VIACEP_ERROR",
              details: {
                cep,
                message: "CEP não encontrado. Verifique o número digitado."
              }
            },
            { status: 404 }
          );
        }

        if (error.message.includes('Erro ao buscar CEP')) {
          return NextResponse.json(
            { 
              error: "Erro ao buscar CEP", 
              code: "VIACEP_ERROR",
              details: {
                cep,
                message: "Erro ao buscar CEP. Verifique sua conexão e tente novamente."
              }
            },
            { status: 503 }
          );
        }
      }

      // Generic error
      throw error;
    }
  } catch (error) {
    console.error("Unexpected error in GET /api/location/cep/:cep:", error);
    return NextResponse.json(
      { 
        error: "Erro ao buscar CEP", 
        code: "VIACEP_ERROR",
        details: {
          message: "Erro inesperado ao buscar CEP. Tente novamente."
        }
      },
      { status: 500 }
    );
  }
}
