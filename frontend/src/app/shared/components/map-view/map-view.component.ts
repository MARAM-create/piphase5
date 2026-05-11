import {
  Component,
  Input,
  ViewChild,
  ElementRef,
  AfterViewInit,
  Output,
  EventEmitter,
  OnChanges,
  SimpleChanges
} from '@angular/core';
import { CommonModule } from '@angular/common';
import * as L from 'leaflet';
import { AnnonceLocationDTO } from '../../../core/models/annonce';

type TunisiaCity = {
  name: string;
  lat: number;
  lng: number;
  zoom: number;
};

@Component({
  selector: 'app-map-view',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="relative w-full h-full">
      <div
        #mapContainer
        class="w-full h-full min-h-[420px] bg-slate-200 rounded-2xl overflow-hidden"
      ></div>

      <!-- City filter -->
      <div class="absolute top-5 left-5 z-[500] w-[230px]">
        <select
          class="w-full px-4 py-3 rounded-xl bg-white text-slate-800 text-sm font-semibold shadow-xl border border-slate-200 outline-none focus:ring-2 focus:ring-[#d9a755]"
          [value]="selectedCityName"
          (change)="focusCity($any($event.target).value)"
        >
          <option value="tunisia">Toute la Tunisie</option>

          <option *ngFor="let city of tunisiaCities" [value]="city.name">
            {{ city.name }}
          </option>
        </select>
      </div>

      <button
        type="button"
        class="absolute top-5 right-5 z-[500] hidden sm:inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-[#073d29] hover:bg-[#052f20] text-white text-sm font-bold shadow-xl transition"
        (click)="focusTunisia()"
      >
        <span class="text-lg leading-none">⌖</span>
        Rechercher dans cette zone
      </button>
    </div>
  `
})
export class MapViewComponent implements AfterViewInit, OnChanges {
  @Input() annonces: AnnonceLocationDTO[] = [];
  @Output() markerClick = new EventEmitter<number>();

  @ViewChild('mapContainer') mapContainer!: ElementRef<HTMLDivElement>;

  private map!: L.Map;
  private markersLayer!: L.LayerGroup;
  private mapReady = false;

  selectedCityName = 'tunisia';

  tunisiaCities: TunisiaCity[] = [
    { name: 'Tunis', lat: 36.8065, lng: 10.1815, zoom: 12 },
    { name: 'Ariana', lat: 36.8665, lng: 10.1647, zoom: 12 },
    { name: 'Ben Arous', lat: 36.7531, lng: 10.2189, zoom: 12 },
    { name: 'Manouba', lat: 36.8101, lng: 10.0956, zoom: 12 },
    { name: 'Nabeul', lat: 36.4513, lng: 10.7350, zoom: 12 },
    { name: 'Bizerte', lat: 37.2744, lng: 9.8739, zoom: 12 },
    { name: 'Béja', lat: 36.7256, lng: 9.1817, zoom: 12 },
    { name: 'Jendouba', lat: 36.5011, lng: 8.7802, zoom: 12 },
    { name: 'Kef', lat: 36.1742, lng: 8.7049, zoom: 12 },
    { name: 'Siliana', lat: 36.0833, lng: 9.3667, zoom: 12 },
    { name: 'Sousse', lat: 35.8256, lng: 10.63699, zoom: 12 },
    { name: 'Monastir', lat: 35.7643, lng: 10.8113, zoom: 12 },
    { name: 'Mahdia', lat: 35.5047, lng: 11.0622, zoom: 12 },
    { name: 'Sfax', lat: 34.7406, lng: 10.7603, zoom: 12 },
    { name: 'Kairouan', lat: 35.6781, lng: 10.0963, zoom: 12 },
    { name: 'Kasserine', lat: 35.1676, lng: 8.8365, zoom: 12 },
    { name: 'Sidi Bouzid', lat: 35.0382, lng: 9.4858, zoom: 12 },
    { name: 'Gabès', lat: 33.8815, lng: 10.0982, zoom: 12 },
    { name: 'Médenine', lat: 33.3549, lng: 10.5055, zoom: 12 },
    { name: 'Tataouine', lat: 32.9297, lng: 10.4518, zoom: 12 },
    { name: 'Gafsa', lat: 34.4250, lng: 8.7842, zoom: 12 },
    { name: 'Tozeur', lat: 33.9197, lng: 8.1335, zoom: 12 },
    { name: 'Kebili', lat: 33.7044, lng: 8.9690, zoom: 12 },
    { name: 'Zaghouan', lat: 36.4029, lng: 10.1429, zoom: 12 }
  ];

  ngAfterViewInit(): void {
    this.initMap();
    this.mapReady = true;
    this.renderMarkers();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['annonces'] && this.mapReady) {
      this.renderMarkers();
    }
  }

  private initMap(): void {
    // Default focus: Tunisia
    this.map = L.map(this.mapContainer.nativeElement, {
      center: [34.0, 9.0],
      zoom: 6,
      minZoom: 5,
      maxZoom: 19
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19
    }).addTo(this.map);

    this.markersLayer = L.layerGroup().addTo(this.map);

    setTimeout(() => {
      this.map.invalidateSize();
      this.focusTunisia();
    }, 200);
  }

  focusTunisia(): void {
    if (!this.map) return;

    this.selectedCityName = 'tunisia';

    // Tunisia bounds
    const tunisiaBounds = L.latLngBounds(
      [30.2, 7.3],
      [37.6, 11.7]
    );

    this.map.fitBounds(tunisiaBounds, {
      padding: [30, 30],
      animate: true
    });
  }

  focusCity(cityName: string): void {
    if (!this.map) return;

    this.selectedCityName = cityName;

    if (cityName === 'tunisia') {
      this.focusTunisia();
      return;
    }

    const city = this.tunisiaCities.find(c => c.name === cityName);

    if (!city) return;

    this.map.flyTo([city.lat, city.lng], city.zoom, {
      animate: true,
      duration: 0.8
    });
  }

  private renderMarkers(): void {
    if (!this.map || !this.markersLayer) return;

    this.markersLayer.clearLayers();

    this.annonces.forEach(annonce => {
      const lat = annonce?.adresse?.latitude;
      const lng = annonce?.adresse?.longitude;

      if (lat == null || lng == null) return;

      const marker = L.circleMarker([lat, lng], {
        radius: 18,
        fillColor: '#0b3b28',
        color: '#ffffff',
        weight: 3,
        opacity: 1,
        fillOpacity: 0.9
      }).addTo(this.markersLayer);

      marker.bindPopup(`
        <div style="text-align:center;">
          <p style="font-weight:bold; font-size:14px; margin:0 0 6px;">
            ${annonce.titre ?? 'Annonce'}
          </p>

          <p style="font-size:14px; color:#0b3b28; font-weight:700; margin:0;">
            ${annonce.prixMensuel ?? 0} €/mois
          </p>
        </div>
      `);

      marker.on('click', () => {
        this.markerClick.emit(annonce.idAnnonce);
      });
    });
  }
}
