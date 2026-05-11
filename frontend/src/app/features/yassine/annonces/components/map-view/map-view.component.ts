import { Component, Input, ViewChild, ElementRef, AfterViewInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';

declare const L: any;

@Component({
  selector: 'app-map-detail',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="w-full h-full bg-slate-200 rounded-lg overflow-hidden" #mapContainer></div>
  `
})
export class MapDetailComponent implements AfterViewInit, OnChanges {
  @Input() latitude!: number;
  @Input() longitude!: number;
  @Input() titre: string = 'Localisation';

  @ViewChild('mapContainer') mapContainer!: ElementRef;
  private map: any;
  private marker: any;

  ngAfterViewInit(): void {
    this.initMap();
  }

  ngOnChanges(changes: SimpleChanges): void {
    // ✅ Update map when coordinates change
    if (this.map && (changes['latitude'] || changes['longitude'])) {
      this.updateMapView();
    }
  }

  private initMap(): void {
    const L = (window as any).L;
    if (!L) {
      console.warn('Leaflet not loaded');
      return;
    }

    if (!this.latitude || !this.longitude) {
      console.warn('⚠️ Latitude or Longitude is missing');
      return;
    }

    // ✅ Create map centered on the listing
    this.map = L.map(this.mapContainer.nativeElement).setView(
      [this.latitude, this.longitude],
      15 // ✅ Zoom level 15 for detail view
    );

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19
    }).addTo(this.map);

    // ✅ Add marker at exact location
    this.marker = L.circleMarker([this.latitude, this.longitude], {
      radius: 30,
      fillColor: '#4f46e5',
      color: '#fff',
      weight: 3,
      opacity: 1,
      fillOpacity: 0.8
    }).addTo(this.map);

    // ✅ Bind popup to marker
    this.marker.bindPopup(`
      <div class="text-center">
        <p class="font-bold text-sm">${this.titre}</p>
        <p class="text-xs text-gray-600">
          📍 ${this.latitude.toFixed(4)}, ${this.longitude.toFixed(4)}
        </p>
      </div>
    `, { autoClose: false }).openPopup();
  }

  private updateMapView(): void {
    if (!this.map || !this.latitude || !this.longitude) return;

    // ✅ Update map view
    this.map.setView([this.latitude, this.longitude], 15);

    // ✅ Remove old marker if exists
    if (this.marker) {
      this.marker.remove();
    }

    // ✅ Add new marker
    this.marker = L.circleMarker([this.latitude, this.longitude], {
      radius: 30,
      fillColor: '#4f46e5',
      color: '#fff',
      weight: 3,
      opacity: 1,
      fillOpacity: 0.8
    }).addTo(this.map);

    this.marker.bindPopup(`
      <div class="text-center">
        <p class="font-bold text-sm">${this.titre}</p>
        <p class="text-xs text-gray-600">
          📍 ${this.latitude.toFixed(4)}, ${this.longitude.toFixed(4)}
        </p>
      </div>
    `, { autoClose: false }).openPopup();
  }
}
