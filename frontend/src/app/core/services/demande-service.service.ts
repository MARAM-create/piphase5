import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  DemandeServiceRequest,
  DemandeServiceResponse,
  DisponibiliteDTO,
  ProfilPrestataireDTO
} from '../models/demande-service.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class DemandeServiceService {

  private readonly API = `${environment.apiUrl}/api/services`;

  constructor(private http: HttpClient) {}

  private headers(): HttpHeaders {
    return new HttpHeaders({
      Authorization: `Bearer ${localStorage.getItem('token')}`
    });
  }

  listerPrestataires(): Observable<ProfilPrestataireDTO[]> {
    return this.http.get<ProfilPrestataireDTO[]>(
      `${this.API}/prestataires`, { headers: this.headers() });
  }

  getMonProfil(): Observable<{ville: string, adresse: string}> {
    return this.http.get<{ville: string, adresse: string}>(
      `${this.API}/mon-profil`, { headers: this.headers() });
  }

  getDisponibilites(prestataireId: number): Observable<DisponibiliteDTO[]> {
    return this.http.get<DisponibiliteDTO[]>(
      `${this.API}/prestataires/${prestataireId}/disponibilites`,
      { headers: this.headers() });
  }

  envoyerDemande(data: DemandeServiceRequest): Observable<DemandeServiceResponse> {
    return this.http.post<DemandeServiceResponse>(
      `${this.API}/demandes`, data, { headers: this.headers() });
  }

  modifierDemande(id: number, data: DemandeServiceRequest): Observable<DemandeServiceResponse> {
    return this.http.put<DemandeServiceResponse>(
      `${this.API}/demandes/${id}`, data, { headers: this.headers() });
  }

  supprimerDemande(id: number): Observable<void> {
    return this.http.delete<void>(
      `${this.API}/demandes/${id}`, { headers: this.headers() });
  }

  toutesLesDemandes(): Observable<DemandeServiceResponse[]> {
    return this.http.get<DemandeServiceResponse[]>(
      `${this.API}/demandes/toutes`, { headers: this.headers() });
  }

  mesDemandes(): Observable<DemandeServiceResponse[]> {
    return this.http.get<DemandeServiceResponse[]>(
      `${this.API}/demandes/mes-demandes`, { headers: this.headers() });
  }

  demandesRecues(): Observable<DemandeServiceResponse[]> {
    return this.http.get<DemandeServiceResponse[]>(
      `${this.API}/demandes/recues`, { headers: this.headers() });
  }

  getDetail(id: number): Observable<DemandeServiceResponse> {
    return this.http.get<DemandeServiceResponse>(
      `${this.API}/demandes/${id}`, { headers: this.headers() });
  }

  accepter(id: number): Observable<DemandeServiceResponse> {
    return this.http.post<DemandeServiceResponse>(
      `${this.API}/demandes/${id}/accepter`, {}, { headers: this.headers() });
  }

  refuser(id: number): Observable<DemandeServiceResponse> {
    return this.http.post<DemandeServiceResponse>(
      `${this.API}/demandes/${id}/refuser`, {}, { headers: this.headers() });
  }

  getPhotoUrl(photo: string): string {
    return photo ? `${environment.apiUrl}/uploads/${photo}` : '';
  }
}
