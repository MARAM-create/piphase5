import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Paiement } from '../models/paiement.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class PaiementService {

  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/api`;

  initierPaiement(contratId: number): Observable<Paiement> {
    return this.http.post<Paiement>(`${this.apiUrl}/paiements/initier/${contratId}`, null);
  }

  validerPaiement(sessionId: string): Observable<string> {
    const params = new HttpParams().set('sessionId', sessionId);
    return this.http.get(`${this.apiUrl}/paiements/success`, { params, responseType: 'text' });
  }

  getAllPaiements(): Observable<Paiement[]> {
    return this.http.get<Paiement[]>(`${this.apiUrl}/paiements`);
  }

  getMyPaiements(): Observable<Paiement[]> {
    console.log('Fetching payments from:', `${this.apiUrl}/paiements/me`);
    return this.http.get<Paiement[]>(`${this.apiUrl}/paiements/me`);
  }

  getPaiementsByContratId(contratId: number): Observable<Paiement[]> {
    return this.http.get<Paiement[]>(`${this.apiUrl}/paiements/contrat/${contratId}`);
  }

  downloadRecu(id: number): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/paiements/${id}/recu`, { responseType: 'blob' });
  }
}
