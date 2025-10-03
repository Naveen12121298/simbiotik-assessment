import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

// Define the shape of the data we get from Nominatim
export interface NominatimResult {
  display_name: string;
  lat: string; // Latitude as a string
  lon: string; // Longitude as a string
}

@Injectable({
  providedIn: 'root'
})
export class GeocodingService {
  private nominatimUrl = 'https://nominatim.openstreetmap.org/search?format=json&q=';

  constructor(private http: HttpClient) {}

  /**
   * Searches for locations using the Nominatim Geocoding API.
   * @param query The search string (e.g., "Paris").
   * @returns A promise resolving to an array of location results.
   */
  async search(query: string): Promise<NominatimResult[]> {
    if (!query) return [];

    const url = `${this.nominatimUrl}${encodeURIComponent(query)}`;

    // Use firstValueFrom for modern async/await usage with RxJS
    try {
      const results = await firstValueFrom(this.http.get<NominatimResult[]>(url));
      return results.slice(0, 5); // Limit to top 5 results
    } catch (error) {
      console.error('Geocoding API failed:', error);
      return [];
    }
  }
}
