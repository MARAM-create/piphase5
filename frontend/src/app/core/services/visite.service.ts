import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface VisiteDTO {
  idVisite?: number;

  demandeId: number;
  annonceId: number;
  etudiantId: number;
  proprietaireId: number;

  modeVisite?: 'DIRECT' | 'VIDEO' | 'VISITE_3D';
  statutVisite?: string;

  dateVisite?: string | null;
  heureDebut?: string | null;
  heureFin?: string | null;

  meetSpaceName?: string | null;
  meetingCode?: string | null;
  meetUri?: string | null;
  calendarEventId?: string | null;

  driveFileId?: string | null;
  videoUrl?: string | null;

  message?: string | null;

  createdAt?: string;
  updatedAt?: string;
  jitsiUri?: string | null;
  jitsiRoomName?: string | null;

  nomEtudiant?: string;
  titreAnnonce?: string;
  etudiantEmail?: string;
  demandeLibelle?: string;

}

@Injectable({
  providedIn: 'root'
})
export class VisiteService {
  private http = inject(HttpClient);
  private readonly API = `${environment.apiUrl}/api/visites`;
  private apiUrl = 'http://192.168.1.175:30808/api/visites';

  creerOuMettreAJour(dto: VisiteDTO): Observable<VisiteDTO> {
    return this.http.post<VisiteDTO>(this.API, dto);
  }

  getByDemande(demandeId: number): Observable<VisiteDTO> {
    return this.http.get<VisiteDTO>(`${this.API}/demande/${demandeId}`);
  }

  getByProprietaire(proprietaireId: number): Observable<VisiteDTO[]> {
    return this.http.get<VisiteDTO[]>(`${this.API}/proprietaire/${proprietaireId}`);
  }

  getByEtudiant(etudiantId: number): Observable<VisiteDTO[]> {
    return this.http.get<VisiteDTO[]>(`${this.API}/etudiant/${etudiantId}`);
  }
  getById(idVisite: number): Observable<VisiteDTO> {
    return this.http.get<VisiteDTO>(`${this.API}/${idVisite}`);
  }
  modifierVideoVisite(idVisite: number, formData: FormData): Observable<any> {
    return this.http.put<any>(
      `${this.apiUrl}/${idVisite}/video`,
      formData
    );
  }

}
