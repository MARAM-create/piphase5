import { AfterViewInit, Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { MeubleService } from '../../../../core/services/meuble.service';
import { Meuble } from '../../../../core/models/meuble.model';
import * as L from 'leaflet';

import {
  FurnitureVerificationService,
  FurnitureResult
} from '../../../../core/services/furniture-verification.service';

@Component({
  selector: 'app-meuble-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, HttpClientModule],
  templateUrl: './meuble-form.component.html',
  styleUrls: ['./meuble-form.component.css'],
})
export class MeubleFormComponent implements OnInit, AfterViewInit, OnDestroy {
  form!: FormGroup;

  photosSelectionnees: File[] = [];
  apercuPhotos: string[] = [];

  chargement = false;
  erreur = '';

  modeModification = false;
  meubleId: number | null = null;

  @ViewChild('mapContainer') mapContainer!: ElementRef<HTMLDivElement>;

  private map!: L.Map;
  private marker!: L.Marker;

  latitude: number | null = null;
  longitude: number | null = null;
  adresseSelectionnee = '';

  // Vérification image IA
  selectedFile: File | null = null;
  isVerifying = false;
  imageError = '';
  imageValid = false;
  confidence = 0;

  etats = [
    { valeur: 'NEUF', label: 'Neuf' },
    { valeur: 'BON_ETAT', label: 'Bon état' },
    { valeur: 'USAGE', label: 'Usagé' }
  ];

  categories = ['Lit', 'Bureau', 'Chaise', 'Armoire', 'Canapé', 'Table', 'Étagère', 'Autre'];

  constructor(
    private fb: FormBuilder,
    private meubleService: MeubleService,
    private router: Router,
    private route: ActivatedRoute,
    private http: HttpClient,
    private furnitureService: FurnitureVerificationService
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      titre: ['', [Validators.required, Validators.minLength(3)]],
      description: ['', Validators.required],
      prix: [null, [Validators.required, Validators.min(0)]],
      etat: ['', Validators.required],
      categorie: ['', Validators.required],
      ville: ['', Validators.required]
    });

    const id = this.route.snapshot.paramMap.get('id');

    if (id) {
      this.modeModification = true;
      this.meubleId = Number(id);

      this.meubleService.getDetail(this.meubleId).subscribe({
        next: (m: Meuble) => this.form.patchValue(m),
        error: () => this.erreur = 'Meuble introuvable'
      });
    }
  }

  ngAfterViewInit(): void {
    this.initialiserCarte();
  }

  ngOnDestroy(): void {
    if (this.map) {
      this.map.remove();
    }
  }

  initialiserCarte(): void {
    this.map = L.map(this.mapContainer.nativeElement, {
      center: [36.8065, 10.1815],
      zoom: 11
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(this.map);

    this.map.on('click', (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;

      this.latitude = +lat.toFixed(6);
      this.longitude = +lng.toFixed(6);

      if (this.marker) {
        this.marker.setLatLng([lat, lng]);
      } else {
        this.marker = L.marker([lat, lng]).addTo(this.map);
      }

      this.reverseGeocode(lat, lng);
    });

    setTimeout(() => this.map.invalidateSize(), 200);
  }

  reverseGeocode(lat: number, lng: number): void {
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&accept-language=fr`;

    this.http.get<any>(url).subscribe({
      next: (res) => {
        this.adresseSelectionnee = res?.display_name || 'Adresse introuvable';

        this.form.patchValue({
          ville: this.adresseSelectionnee
        });

        if (this.marker) {
          this.marker.bindPopup(this.adresseSelectionnee).openPopup();
        }

        this.form.get('ville')?.markAsTouched();
        this.form.get('ville')?.updateValueAndValidity();
      },
      error: () => {
        this.adresseSelectionnee = 'Adresse introuvable';

        this.form.patchValue({
          ville: ''
        });
      }
    });
  }

  onPhotosChange(event: Event): void {
    const input = event.target as HTMLInputElement;

    if (!input.files || input.files.length === 0) {
      return;
    }

    // Reset
    this.imageError = '';
    this.imageValid = false;
    this.selectedFile = null;
    this.confidence = 0;
    this.photosSelectionnees = [];
    this.apercuPhotos = [];
    this.isVerifying = true;

    const files = Array.from(input.files);

    /*
     * Vérification IA :
     * ici on vérifie la première image sélectionnée.
     * Comme ton backend vérifie aussi la première photo,
     * cette logique reste cohérente avec ton contrôleur Spring Boot.
     */
    const imagePrincipale = files[0];

    this.furnitureService.verifyImage(imagePrincipale).subscribe({
      next: (result: FurnitureResult) => {
        this.isVerifying = false;

        if (result.isFurniture) {
          this.imageValid = true;
          this.selectedFile = imagePrincipale;
          this.confidence = result.confidence;

          this.photosSelectionnees = files;
          this.apercuPhotos = [];

          files.forEach(file => {
            const reader = new FileReader();

            reader.onload = (e) => {
              this.apercuPhotos.push(e.target?.result as string);
            };

            reader.readAsDataURL(file);
          });
        } else {
          this.imageError = result.message || 'Cette image ne semble pas être un meuble.';
          this.imageValid = false;
          this.selectedFile = null;
          this.photosSelectionnees = [];
          this.apercuPhotos = [];

          input.value = '';
        }
      },
      error: (e) => {
        this.isVerifying = false;
        this.imageValid = false;
        this.selectedFile = null;
        this.photosSelectionnees = [];
        this.apercuPhotos = [];

        this.imageError =
          e.error?.message ||
          'Erreur lors de la vérification de l’image.';

        input.value = '';
      }
    });
  }

  soumettre(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    if (!this.modeModification && this.photosSelectionnees.length === 0) {
      this.imageError = 'Veuillez ajouter au moins une photo du meuble.';
      return;
    }

    if (this.photosSelectionnees.length > 0 && !this.imageValid) {
      this.imageError = 'Veuillez attendre la validation de l’image.';
      return;
    }

    if (this.isVerifying) {
      this.imageError = 'Vérification de l’image en cours. Veuillez patienter.';
      return;
    }

    this.chargement = true;
    this.erreur = '';

    const data = this.form.value;

    if (this.modeModification && this.meubleId) {
      this.meubleService.modifierMeuble(this.meubleId, data, this.photosSelectionnees).subscribe({
        next: () => this.router.navigate(['/meubles/mes-meubles']),
        error: (e) => {
          this.erreur = e.error?.message || 'Erreur lors de la modification du meuble.';
          this.chargement = false;
        }
      });
    } else {
      this.meubleService.publierMeuble(data, this.photosSelectionnees).subscribe({
        next: () => this.router.navigate(['/meubles']),
        error: (e) => {
          this.erreur = e.error?.message || 'Erreur lors de la publication du meuble.';
          this.chargement = false;
        }
      });
    }
  }

  get f() {
    return this.form.controls;
  }
}
