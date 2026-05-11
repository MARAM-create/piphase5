import { Component } from '@angular/core';

@Component({
  selector: 'app-photo-gallery',
  standalone: true, // ✅ REQUIRED
  imports: [],      // now valid
  templateUrl: './photo-gallery.component.html'
})
export class PhotoGalleryComponent {}
