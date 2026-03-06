import type { Profile, LocationData, ViaCepResponse } from "@/types";

/**
 * Valid Brazilian state codes
 */
const VALID_BRAZILIAN_STATES = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO',
  'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI',
  'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
] as const;

export class LocationService {
  /**
   * Fetch address data from ViaCEP API
   * @param cep - 8-digit CEP string
   * @returns Address data or error
   */
  static async fetchAddressByCep(cep: string): Promise<ViaCepResponse> {
    // Validate CEP format before making API call
    if (!this.validateCep(cep)) {
      throw new Error('CEP inválido. Deve conter exatamente 8 dígitos numéricos.');
    }

    // Remove any non-numeric characters
    const cleanCep = cep.replace(/\D/g, '');

    try {
      const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('CEP não encontrado. Verifique o número digitado.');
        }
        throw new Error('Erro ao buscar CEP. Tente novamente.');
      }

      const data: ViaCepResponse = await response.json();

      // ViaCEP returns { erro: true } for invalid CEPs
      if (data.erro) {
        throw new Error('CEP não encontrado. Verifique o número digitado.');
      }

      return data;
    } catch (error) {
      if (error instanceof Error) {
        // Re-throw known errors
        if (error.message.includes('CEP não encontrado') || 
            error.message.includes('CEP inválido')) {
          throw error;
        }
      }
      
      // Network or other errors
      throw new Error('Erro ao buscar CEP. Verifique sua conexão e tente novamente.');
    }
  }

  /**
   * Validate CEP format
   * @param cep - CEP string to validate
   * @returns true if valid, false otherwise
   */
  static validateCep(cep: string): boolean {
    if (!cep) return false;
    
    // Remove any non-numeric characters
    const cleanCep = cep.replace(/\D/g, '');
    
    // Must be exactly 8 digits
    return cleanCep.length === 8 && /^\d{8}$/.test(cleanCep);
  }

  /**
   * Validate Brazilian state code
   * @param state - State code to validate
   * @returns true if valid, false otherwise
   */
  static validateStateCode(state: string): boolean {
    if (!state) return false;
    
    const upperState = state.toUpperCase();
    return VALID_BRAZILIAN_STATES.includes(upperState as typeof VALID_BRAZILIAN_STATES[number]);
  }

  /**
   * Get effective state for filtering
   * Prioritizes address_state over city (Estado Base)
   * @param profile - Profile object
   * @returns State code to use for filtering
   */
  static getEffectiveState(profile: Profile): string {
    // Prioritize address_state if available
    if (profile.address_state && profile.address_state.trim() !== '') {
      return profile.address_state;
    }
    
    // Fall back to city (Estado Base)
    return profile.city;
  }

  /**
   * Format address for display
   * @param location - Location data
   * @returns Formatted address string or null if incomplete
   */
  static formatAddress(location: LocationData): string | null {
    // Check if we have the minimum required fields
    if (!location.street || !location.number || !location.neighborhood || 
        !location.city || !location.state) {
      return null;
    }

    // Format: "Rua, Número - Bairro, Cidade - Estado, CEP"
    let formatted = `${location.street}, ${location.number} - ${location.neighborhood}, ${location.city} - ${location.state}`;
    
    // Add CEP if available
    if (location.cep) {
      formatted += `, ${location.cep}`;
    }

    return formatted;
  }

  /**
   * Format approximate location for public display (privacy-safe)
   * Only shows neighborhood, city, and state - no exact address
   * @param location - Location data
   * @returns Formatted approximate location string or null if incomplete
   */
  static formatApproximateLocation(location: LocationData): string | null {
    // Check if we have the minimum required fields for approximate location
    if (!location.neighborhood || !location.city || !location.state) {
      return null;
    }

    // Format: "Bairro, Cidade - Estado"
    return `${location.neighborhood}, ${location.city} - ${location.state}`;
  }

  /**
   * Get list of valid Brazilian state codes
   * @returns Array of valid state codes
   */
  static getValidStates(): readonly string[] {
    return VALID_BRAZILIAN_STATES;
  }
}
