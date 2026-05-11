import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class Visite3dService {

  private readonly API_URL = 'http://192.168.1.175:30808/api/visites-3d';
  private readonly BACKEND_URL = 'http://192.168.1.175:30808';

  constructor(private http: HttpClient) {}

  publierVisite3D(metadata: any, files: File[]): Observable<any> {
    const formData = new FormData();

    formData.append('metadata', JSON.stringify(metadata));

    files.forEach(file => {
      formData.append('files', file);
    });

    return this.http.post<any>(`${this.API_URL}/publier`, formData);
  }

  getByDemande(demandeId: number): Observable<any> {
    return this.http.get<any>(`${this.API_URL}/demande/${demandeId}`);
  }

  toFullImageUrl(url: string): string {
    if (!url) return '';

    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }

    return this.BACKEND_URL + url;
  }

  getByAnnonce(annonceId: number): Observable<any> {
    return this.http.get<any>(`${this.API_URL}/annonce/${annonceId}`);
  }

  envoyerVisite3D(payload: any) {
    return this.http.post<any>(`${this.API_URL}/envoyer`, payload);
  }

  getDemandesPartageesEtudiant(etudiantId: number) {
    return this.http.get<number[]>(`${this.API_URL}/partages/etudiant/${etudiantId}`);
  }

  getByDemandePartagee(demandeId: number) {
    return this.http.get<any>(`${this.API_URL}/demande-partagee/${demandeId}`);
  }
}
