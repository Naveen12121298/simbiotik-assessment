import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

// Define the shape of the data we get from OSRM
export interface OsrmRoute {
  geometry: string; // Encoded polyline string
  distance: number; // In meters
  duration: number; // In seconds
}

export interface OsrmResponse {
  routes: OsrmRoute[];
  code: string; // e.g., 'Ok'
}

@Injectable({
  providedIn: 'root'
})
export class RoutingService {
  // OSRM expects coordinates as: longitude, latitude
  private osrmUrl = 'https://router.project-osrm.org/route/v1/driving/';

  constructor(private http: HttpClient) {}

  /**
   * Calculates a driving route between two points using OSRM.
   * @param start [lng, lat] of the origin.
   * @param end [lng, lat] of the destination.
   * @returns A promise resolving to the OSRM response data.
   */
  async getRoute(start: [number, number], end: [number, number]): Promise<OsrmResponse | null> {
    // Format: lng,lat;lng,lat
    const coordsString = `${start[0]},${start[1]};${end[0]},${end[1]}`;
    const url = `${this.osrmUrl}${coordsString}?overview=full`;

    try {
      const data = await firstValueFrom(this.http.get<OsrmResponse>(url));
      if (data.code !== 'Ok') {
        throw new Error(`OSRM Error: ${data.code}`);
      }
      return data;
    } catch (error) {
      console.error('Routing API failed:', error);
      return null;
    }
  }
}
