// src/app/core/services/meuble.service.ts

import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Meuble, MeubleRequest } from '../models/meuble.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class MeubleService {

  private readonly API = `${environment.apiUrl}/api/meubles`;

  constructor(private http: HttpClient) {}

  private getToken(): string | null {
    return localStorage.getItem('token');
  }

  private authHeaders(): HttpHeaders {
    return new HttpHeaders({
      Authorization: `Bearer ${this.getToken()}`
    });
  }

  // Lister tous les meubles disponibles (public)
  listerMeubles(): Observable<Meuble[]> {
    return this.http.get<Meuble[]>(this.API);
  }

  // Détail d'un meuble
  getDetail(id: number): Observable<Meuble> {
    return this.http.get<Meuble>(`${this.API}/${id}`);
  }

  // Mes meubles publiés
  mesMeubles(): Observable<Meuble[]> {
    return this.http.get<Meuble[]>(`${this.API}/mes-meubles`, {
      headers: this.authHeaders()
    });
  }

  // Publier un meuble avec photos
  publierMeuble(data: MeubleRequest, photos: File[]): Observable<Meuble> {
    const formData = new FormData();
    const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
    formData.append('meuble', blob);
    photos.forEach(p => formData.append('photos', p));
    return this.http.post<Meuble>(this.API, formData, {
      headers: this.authHeaders()
    });
  }

  // Modifier un meuble
  modifierMeuble(id: number, data: MeubleRequest, photos: File[]): Observable<Meuble> {
    const formData = new FormData();
    const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
    formData.append('meuble', blob);
    photos.forEach(p => formData.append('photos', p));
    return this.http.put<Meuble>(`${this.API}/${id}`, formData, {
      headers: this.authHeaders()
    });
  }

  // Supprimer un meuble
  supprimerMeuble(id: number): Observable<void> {
    return this.http.delete<void>(`${this.API}/${id}`, {
      headers: this.authHeaders()
    });
  }

  // Acheter un meuble
  acheterMeuble(id: number): Observable<Meuble> {
    return this.http.post<Meuble>(`${this.API}/${id}/acheter`, {}, {
      headers: this.authHeaders()
    });
  }

  // URL complète d'une photo
  getPhotoUrl(nomFichier: string): string {
    return `${environment.apiUrl}/uploads/meubles/${nomFichier}`;
  }

  getPrestatairesDemo(): Observable<any[]> {
    return this.http.get<any[]>(
      `${environment.apiUrl}/api/meubles/prestataires-demenagement`,
      { headers: new HttpHeaders({ Authorization: `Bearer ${localStorage.getItem('token')}` }) }
    );
  }

  envoyerRecuSansTransport(id: number): Observable<void> {
    return this.http.post<void>(
      `${environment.apiUrl}/api/meubles/${id}/recu-sans-transport`,
      {},
      { headers: new HttpHeaders({ Authorization: `Bearer ${localStorage.getItem('token')}` }) }
    );
  }

  mesAchats(): Observable<Meuble[]> {
    return this.http.get<Meuble[]>(
      `${environment.apiUrl}/api/meubles/mes-achats`,
      { headers: new HttpHeaders({ Authorization: `Bearer ${localStorage.getItem('token')}` }) }
    );
  }

  rendreDisponible(id: number): Observable<Meuble> {
    return this.http.post<Meuble>(
      `${environment.apiUrl}/api/meubles/${id}/rendre-disponible`,
      {},
      { headers: new HttpHeaders({
          Authorization: `Bearer ${localStorage.getItem('token')}`
        })}
    );
  }
}
