import { createClient } from "@/lib/supabase/server";

export interface GeolocationResult {
  state: string;
  country: string;
}

/**
 * GeolocationService
 * 
 * Maps IP addresses to Brazilian states using IP-API.com with caching.
 * Implements 30-day cache to reduce external API calls.
 */
export class GeolocationService {
  private static readonly API_URL = 'http://ip-api.com/json/';
  private static readonly CACHE_DURATION_DAYS = 30;

  /**
   * Get state from IP address with caching
   * 
   * @param ipAddress - Visitor IP address
   * @returns Brazilian state code, 'Internacional', or 'Não identificado'
   */
  static async getStateFromIP(ipAddress: string): Promise<string> {
    // Check cache first
    const cached = await this.getCachedState(ipAddress);
    if (cached) {
      return cached;
    }

    // Call external API
    try {
      const response = await fetch(`${this.API_URL}${ipAddress}?fields=country,regionName`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        console.error(`Geolocation API error: ${response.status}`);
        return 'Não identificado';
      }

      const data = await response.json();

      if (data.status === 'success') {
        const state = data.country === 'Brazil' 
          ? this.mapRegionToState(data.regionName)
          : 'Internacional';

        // Cache result
        await this.cacheState(ipAddress, state, data.country);
        
        return state;
      }
    } catch (error) {
      console.error('Geolocation API error:', error);
    }

    return 'Não identificado';
  }

  /**
   * Map region name to Brazilian state abbreviation
   * 
   * @param regionName - Full region name from IP-API
   * @returns Two-letter state code or 'Não identificado'
   */
  private static mapRegionToState(regionName: string): string {
    const stateMap: Record<string, string> = {
      'Acre': 'AC',
      'Alagoas': 'AL',
      'Amapá': 'AP',
      'Amazonas': 'AM',
      'Bahia': 'BA',
      'Ceará': 'CE',
      'Distrito Federal': 'DF',
      'Espírito Santo': 'ES',
      'Goiás': 'GO',
      'Maranhão': 'MA',
      'Mato Grosso': 'MT',
      'Mato Grosso do Sul': 'MS',
      'Minas Gerais': 'MG',
      'Pará': 'PA',
      'Paraíba': 'PB',
      'Paraná': 'PR',
      'Pernambuco': 'PE',
      'Piauí': 'PI',
      'Rio de Janeiro': 'RJ',
      'Rio Grande do Norte': 'RN',
      'Rio Grande do Sul': 'RS',
      'Rondônia': 'RO',
      'Roraima': 'RR',
      'Santa Catarina': 'SC',
      'São Paulo': 'SP',
      'Sergipe': 'SE',
      'Tocantins': 'TO'
    };

    return stateMap[regionName] || 'Não identificado';
  }

  /**
   * Get cached state for IP
   * 
   * @param ipAddress - IP address to lookup
   * @returns Cached state or null if not found/expired
   */
  private static async getCachedState(ipAddress: string): Promise<string | null> {
    try {
      const supabase = await createClient();

      const { data, error } = await supabase
        .from('ip_geolocation_cache')
        .select('state')
        .eq('ip_address', ipAddress)
        .gte('created_at', new Date(Date.now() - this.CACHE_DURATION_DAYS * 24 * 60 * 60 * 1000).toISOString())
        .single();

      if (error || !data) {
        return null;
      }

      return data.state;
    } catch (error) {
      console.error('Error reading geolocation cache:', error);
      return null;
    }
  }

  /**
   * Cache state for IP
   * 
   * @param ipAddress - IP address
   * @param state - State code
   * @param country - Country name
   */
  private static async cacheState(
    ipAddress: string, 
    state: string, 
    country: string
  ): Promise<void> {
    try {
      const supabase = await createClient();

      await supabase
        .from('ip_geolocation_cache')
        .upsert({
          ip_address: ipAddress,
          state,
          country
        }, {
          onConflict: 'ip_address'
        });
    } catch (error) {
      // Cache failures are logged but don't block tracking
      console.error('Error caching geolocation:', error);
    }
  }
}
