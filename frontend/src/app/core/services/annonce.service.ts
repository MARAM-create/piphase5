import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AnnonceLocationDTO } from '../models/annonce';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AnnonceService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/api/annonces`;

  getAll(): Observable<AnnonceLocationDTO[]> {
    return this.http.get<AnnonceLocationDTO[]>(this.apiUrl);
  }

  getById(id: number): Observable<AnnonceLocationDTO> {
    return this.http.get<AnnonceLocationDTO>(`${this.apiUrl}/${id}`);
  }

  create(dto: AnnonceLocationDTO): Observable<AnnonceLocationDTO> {
    return this.http.post<AnnonceLocationDTO>(this.apiUrl, dto);
  }

update(id: number, dto: AnnonceLocationDTO): Observable<AnnonceLocationDTO> {
  const payload = { ...dto, idAnnonce: id };  // ← inject id into body
  return this.http.put<AnnonceLocationDTO>(`${this.apiUrl}/${id}`, payload);
}
  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  createAnnonce(annonce: AnnonceLocationDTO): Observable<AnnonceLocationDTO> {
    return this.http.post<AnnonceLocationDTO>(this.apiUrl, annonce);
  }

  getMesAnnonces(): Observable<AnnonceLocationDTO[]> {
    return this.http.get<AnnonceLocationDTO[]>(`${this.apiUrl}/mes-annonces`);
  }
  // In annonce.service.ts — add this method

publish(id: number): Observable<AnnonceLocationDTO> {
  return this.http.patch<AnnonceLocationDTO>(
    `${this.apiUrl}/${id}/etat`,
    { etatAnnonce: 'PUBLIEE' }
  );
}
}
