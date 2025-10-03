import { AfterViewInit, Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import * as L from 'leaflet';
import * as polyline from 'polyline';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs'; // Needed for async/await with Angular HttpClient
import { GeocodingService, NominatimResult } from '../../services/geocoding.service';
import { RoutingService } from '../../services/routing.service';

// NOTE: You must ensure these paths are correct in your project structure


// Fix for default marker icons not showing up (required for Leaflet)
// NOTE: For this to work, you must copy the Leaflet default marker images
// into your Angular project's 'assets' folder.
const iconRetinaUrl = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png';
const iconUrl = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png';
const shadowUrl = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png';
const iconDefault = L.icon({
  iconRetinaUrl,
  iconUrl,
  shadowUrl,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28],
  shadowSize: [41, 41]
});
L.Marker.prototype.options.icon = iconDefault;

// Define the broader type for polyline coordinates to resolve the TypeScript error
type LatLngExpression = L.LatLngExpression;

@Component({
  selector: 'app-map',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.css']
})
export class MapComponent implements OnInit, AfterViewInit {
  map!: L.Map;

  // Markers and Route Line
  fromMarker: L.Marker | null = null;
  toMarker: L.Marker | null = null;
  routeLine: L.Polyline | null = null;

  // Search State
  fromQuery = '';
  toQuery = '';
  fromResults: NominatimResult[] = [];
  toResults: NominatimResult[] = [];

  // UI/Feedback State
  routeInfo: { distance: string; duration: string } | null = null;
  loadingRoute = false;

  // Map Visibility
  showMap = false;

  constructor(
    private geoService: GeocodingService,
    private routeService: RoutingService,
    private cdr: ChangeDetectorRef // Required to manually trigger view updates
  ) {}

  ngOnInit() {}
  ngAfterViewInit() {}

  // ------------------------------------------------------------------
  // --- Location Search & Selection ---
  // ------------------------------------------------------------------

  async searchFrom() {
    if (this.fromQuery.length < 3) { this.fromResults = []; return; }
    this.fromResults = await this.geoService.search(this.fromQuery);
  }

  async searchTo() {
    if (this.toQuery.length < 3) { this.toResults = []; return; }
    this.toResults = await this.geoService.search(this.toQuery);
  }

  /**
   * Selects a location, places a marker, and initializes the map if necessary.
   */
  selectLocation(result: NominatimResult, type: 'from' | 'to') {
    const latlng = L.latLng(parseFloat(result.lat), parseFloat(result.lon));

    // **********************************************
    // FIX FOR "Cannot read properties of undefined (reading 'addLayer')"
    // Ensure map is initialized before adding any marker
    // **********************************************
    if (!this.map) {
        this.showMap = true; // Show the map container
        this.cdr.detectChanges(); // Force rendering of the map div#map
        this.initMap(); // Initialize the map instance

        if (!this.map) return; // Safety exit if initMap fails
    }
    // **********************************************

    // Clear previous results
    if (type === 'from') {
      this.fromQuery = result.display_name;
      this.fromResults = [];
      if (this.fromMarker) this.map.removeLayer(this.fromMarker);

      // Create new marker
      this.fromMarker = L.marker(latlng, { draggable: true }).addTo(this.map);
      this.fromMarker.on('dragend', () => this.tryRoute());

    } else { // type === 'to'
      this.toQuery = result.display_name;
      this.toResults = [];
      if (this.toMarker) this.map.removeLayer(this.toMarker);

      // Create new marker
      this.toMarker = L.marker(latlng, { draggable: true }).addTo(this.map);
      this.toMarker.on('dragend', () => this.tryRoute());
    }

    // Zoom map
    this.map.setView(latlng, 13);

    // Attempt to route if both locations are selected
    if (this.fromMarker && this.toMarker) {
      this.tryRoute();
    }
  }

  selectFrom(result: NominatimResult) {
    this.selectLocation(result, 'from');
  }

  selectTo(result: NominatimResult) {
    this.selectLocation(result, 'to');
  }

  // ------------------------------------------------------------------
  // --- Map Initialization ---
  // ------------------------------------------------------------------

  private initMap() {
    if (this.map) return;

    this.map = L.map('map', { scrollWheelZoom: true }).setView([20, 77], 5); // Default view

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19
    }).addTo(this.map);

    this.map.on('click', (e: any) => this.handleMapClick(e.latlng));
  }

  handleMapClick(latlng: L.LatLng) {
    const message = 'Set as From (OK) or To (Cancel)?';
    if (confirm(message)) {
      this.reverseGeocode(latlng, 'from');
    } else {
      this.reverseGeocode(latlng, 'to');
    }
  }

  // NOTE: This requires access to the HttpClient in GeocodingService.
  async reverseGeocode(latlng: L.LatLng, type: 'from' | 'to') {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latlng.lat}&lon=${latlng.lng}`;
    try {
      // NOTE: Accessing private http property via bracket notation (geoService['http']) is generally discouraged
      // but is used here as a workaround to avoid modifying the GeocodingService interface just for this component.
      const result = await firstValueFrom(this.geoService['http'].get<{display_name: string}>(url));
      const resultData: NominatimResult = {
          display_name: result.display_name || `Lat: ${latlng.lat.toFixed(4)}, Lng: ${latlng.lng.toFixed(4)}`,
          lat: latlng.lat.toString(),
          lon: latlng.lng.toString()
      };
      this.selectLocation(resultData, type);
    } catch (error) {
      console.error('Reverse Geocoding failed:', error);
      const resultData: NominatimResult = {
          display_name: `Lat: ${latlng.lat.toFixed(4)}, Lng: ${latlng.lng.toFixed(4)}`,
          lat: latlng.lat.toString(),
          lon: latlng.lng.toString()
      };
      this.selectLocation(resultData, type);
    }
  }

  // ------------------------------------------------------------------
  // --- Routing Logic ---
  // ------------------------------------------------------------------

  /**
   * Main function to trigger the route calculation and display.
   */
  async tryRoute() {
    if (!this.fromMarker || !this.toMarker) return;

    this.routeInfo = null;

    // Ensure map is visible and initialized (redundant check, but safe)
    if (!this.map) {
        this.showMap = true;
        this.cdr.detectChanges();
        this.initMap();
        if (!this.map) return;
    }

    await this.drawRoute();
  }




  private async drawRoute() {
    if (!this.fromMarker || !this.toMarker) return;

    this.loadingRoute = true;

    try {
      // OSRM expects [lng, lat]
      const start: [number, number] = [
        this.fromMarker.getLatLng().lng,
        this.fromMarker.getLatLng().lat
      ];
      const end: [number, number] = [
        this.toMarker.getLatLng().lng,
        this.toMarker.getLatLng().lat
      ];

      const data = await this.routeService.getRoute(start, end);

      if (data?.routes?.length) {
        // Decode polyline (returns number[][])
        const coords = polyline.decode(data.routes[0].geometry);

        // Use L.LatLngExpression[] type to satisfy TypeScript for polyline coordinates
        if (this.routeLine) {
          this.routeLine.setLatLngs(coords as LatLngExpression[]);
        } else {
          this.routeLine = L.polyline(coords as LatLngExpression[], { color: 'blue', weight: 5 }).addTo(this.map);
        }

        this.map.fitBounds(this.routeLine.getBounds(), { padding: [50, 50] });

        // Show distance & duration
        this.routeInfo = {
          distance: (data.routes[0].distance / 1000).toFixed(2), // meters to km
          duration: (data.routes[0].duration / 60).toFixed(1)   // seconds to mins
        };
      } else {
        this.routeInfo = null;
        alert('Route not found.');
      }
    } catch (err) {
      console.error(err);
      alert('Route calculation failed.');
      this.routeInfo = null;
    } finally {
      this.loadingRoute = false;
    }
  }
}
