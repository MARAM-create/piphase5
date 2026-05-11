import { Component, Input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PhotoDTO } from '../../../core/models/photo';

@Component({
  selector: 'app-photo-gallery',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="w-full">
      <!-- Main photo + Grid -->
      <div class="grid grid-cols-3 gap-4 mb-4">
        <!-- Main Photo (large) -->
        <div class="col-span-2">
          <img
            [src]="photos[0].url"
            [alt]="photos[0].altText"
            class="w-full h-96 object-cover rounded-lg"
          />
        </div>

        <!-- Grid 2x2 -->
        <div class="grid grid-cols-2 gap-4">
          <img
            *ngFor="let photo of photos.slice(1, 5)"
            [src]="photo.url"
            [alt]="photo.altText"
            (click)="selectPhoto(photo)"
            class="w-full h-44 object-cover rounded-lg cursor-pointer hover:opacity-80 transition-opacity"
          />
        </div>
      </div>

      <!-- View all button -->
      <button
        *ngIf="photos.length > 5"
        (click)="openLightbox()"
        class="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
      >
        Voir toutes les photos ({{ photos.length }})
      </button>

      <!-- Lightbox Modal -->
      <div
        *ngIf="showLightbox()"
        class="fixed inset-0 z-50 bg-black/80 flex items-center justify-center"
        (click)="closeLightbox()"
      >
        <div class="relative max-w-4xl w-full h-96" (click)="$event.stopPropagation()">
          <img
            [src]="photos[currentPhotoIndex()].url"
            [alt]="photos[currentPhotoIndex()].altText"
            class="w-full h-full object-contain"
          />
          <!-- Navigation -->
          <button
            (click)="prevPhoto()"
            class="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white p-2 rounded-full"
          >
            ❮
          </button>
          <button
            (click)="nextPhoto()"
            class="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white p-2 rounded-full"
          >
            ❯
          </button>
          <!-- Close button -->
          <button
            (click)="closeLightbox()"
            class="absolute top-4 right-4 bg-white/80 hover:bg-white p-2 rounded-full text-xl"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  `
})
export class PhotoGalleryComponent {
  @Input() photos: PhotoDTO[] = [];

  showLightbox = signal(false);
  currentPhotoIndex = signal(0);

  selectPhoto(photo: PhotoDTO): void {
    const index = this.photos.findIndex(p => p.id === photo.id);
    if (index >= 0) {
      this.currentPhotoIndex.set(index);
    }
  }

  openLightbox(): void {
    this.showLightbox.set(true);
  }

  closeLightbox(): void {
    this.showLightbox.set(false);
  }

  prevPhoto(): void {
    const newIndex = this.currentPhotoIndex() === 0 ? this.photos.length - 1 : this.currentPhotoIndex() - 1;
    this.currentPhotoIndex.set(newIndex);
  }

  nextPhoto(): void {
    const newIndex = this.currentPhotoIndex() === this.photos.length - 1 ? 0 : this.currentPhotoIndex() + 1;
    this.currentPhotoIndex.set(newIndex);
  }
}
