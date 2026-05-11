import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface VideoUploadResponse {
  url: string;
}

@Injectable({
  providedIn: 'root'
})
export class VideoUploadService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/api/videos`;

  upload(file: File): Observable<VideoUploadResponse> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<VideoUploadResponse>(`${this.apiUrl}/upload`, formData);
  }
}
