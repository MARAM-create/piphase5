import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Contrat } from '../models/contrat.model';
import { Paiement } from '../models/paiement.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ContratService {

  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/api/contrats`;

  getAllContrats(): Observable<Contrat[]> {
    return this.http.get<Contrat[]>(this.apiUrl);
  }

  getContratById(id: number): Observable<Contrat> {
    return this.http.get<Contrat>(`${this.apiUrl}/${id}`);
  }

  createContrat(data: Partial<Contrat>): Observable<Contrat> {
    return this.http.post<Contrat>(this.apiUrl, data);
  }

  uploadContratSigne(contratId: number, file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<any>(`${this.apiUrl}/${contratId}/upload`, formData);
  }

  uploadScan(id: number, file: File): Observable<Contrat> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<Contrat>(`${this.apiUrl}/${id}/upload-scan`, formData);
  }

  simulerAnalyseIa(id: number): Observable<Contrat> {
    return this.http.post<Contrat>(`${this.apiUrl}/${id}/simuler-analyse`, null);
  }

  getContratsFiltres(type: string, searchTerm?: string, searchDate?: string): Observable<Contrat[]> {
    let params: any = { type };
    if (searchTerm) {
      params.searchTerm = searchTerm;
    }
    if (searchDate) {
      params.searchDate = searchDate;
    }
    return this.http.get<Contrat[]>(`${this.apiUrl}/filter`, { params });
  }

  getCalendrierPaiements(id: number): Observable<string[]> {
    return this.http.get<string[]>(`${this.apiUrl}/${id}/calendrier-paiements`);
  }

  initierPaiement(contratId: number): Observable<{ checkoutUrl: string }> {
    return this.http.post<{ checkoutUrl: string }>(`${environment.apiUrl}/api/paiements/initier/${contratId}`, {});
  }

  genererPdf(contratId: number): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/${contratId}/generer-pdf`, {});
  }

  telechargerPdf(contratId: number): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/${contratId}/download`, { responseType: 'blob' });
  }

  supprimerContrat(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  getHistoriquePaiements(contratId: number): Observable<Paiement[]> {
    return this.http.get<Paiement[]>(`${environment.apiUrl}/api/paiements/contrat/${contratId}`);
  }

  creerContrat(demandeId: number): Observable<Contrat> {
    return this.http.post<Contrat>(`${this.apiUrl}/generer/${demandeId}`, {});
  }

  getContratsActifsParBailleur(bailleurId: number): Observable<Contrat[]> {
    return this.http.get<Contrat[]>(`${this.apiUrl}/proprietaire/${bailleurId}/actifs`);
  }

  getTotalPayeParContrat(contratId: number): Observable<{ totalPaye: number }> {
    return this.http.get<{ totalPaye: number }>(`${this.apiUrl}/${contratId}/total-paye`);
  }

  getPaiementsParContrat(contratId: number): Observable<Paiement[]> {
    return this.http.get<Paiement[]>(`${environment.apiUrl}/api/paiements/contrat/${contratId}`);
  }
}
