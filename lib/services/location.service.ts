import geohash from "geohash";

export class LocationService {
  /**
   * Generate a geohash from latitude and longitude
   * @param lat Latitude
   * @param lon Longitude
   * @param precision Precision level (default: 5 for neighborhood-level)
   */
  static generateGeohash(lat: number, lon: number, precision: number = 5): string {
    return geohash.encode(lat, lon, precision);
  }

  /**
   * Truncate a geohash to a specific precision
   * @param hash The geohash to truncate
   * @param targetPrecision Target precision level
   */
  static truncateGeohash(hash: string, targetPrecision: number): string {
    return hash.substring(0, targetPrecision);
  }

  /**
   * Decode a geohash to get approximate coordinates
   * @param hash The geohash to decode
   */
  static decodeGeohash(hash: string): {
    lat: number;
    lon: number;
    latError: number;
    lonError: number;
  } {
    const decoded = geohash.decode(hash);
    const bounds = geohash.decode_bbox(hash);
    
    return {
      lat: decoded.latitude,
      lon: decoded.longitude,
      latError: (bounds[2] - bounds[0]) / 2,
      lonError: (bounds[3] - bounds[1]) / 2,
    };
  }

  /**
   * Get approximate location for privacy (truncated to 5 characters)
   * @param lat Latitude
   * @param lon Longitude
   */
  static getApproximateLocation(lat: number, lon: number): {
    geohash: string;
    displayLat: number;
    displayLon: number;
  } {
    const hash = this.generateGeohash(lat, lon, 5);
    const decoded = this.decodeGeohash(hash);
    
    return {
      geohash: hash,
      displayLat: decoded.lat,
      displayLon: decoded.lon,
    };
  }

  /**
   * Get bounding box for a geohash
   * @param hash The geohash
   */
  static getBoundingBox(hash: string): {
    minLat: number;
    minLon: number;
    maxLat: number;
    maxLon: number;
  } {
    const [minLat, minLon, maxLat, maxLon] = geohash.decode_bbox(hash);
    return { minLat, minLon, maxLat, maxLon };
  }

  /**
   * Get neighbors of a geohash (for proximity search)
   * @param hash The geohash
   */
  static getNeighbors(hash: string): string[] {
    const neighbors = geohash.neighbors(hash);
    return Object.values(neighbors);
  }
}
