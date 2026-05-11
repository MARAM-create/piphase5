// furniture-verification.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface FurnitureResult {
  isFurniture: boolean;
  confidence: number;
  label: string;
  message: string;
}

@Injectable({ providedIn: 'root' })
export class FurnitureVerificationService {

  private apiUrl = 'http://192.168.1.175:30808/api/meubles/verify-image';

  constructor(private http: HttpClient) {}

  verifyImage(file: File): Observable<FurnitureResult> {
    const formData = new FormData();
    formData.append('image', file);
    return this.http.post<FurnitureResult>(this.apiUrl, formData);
  }
}
