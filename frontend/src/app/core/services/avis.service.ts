import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Avis, AvisStats } from '../models/avis.model';

@Injectable({ providedIn: 'root' })
export class AvisService {
  private readonly apiUrl = `${environment.apiUrl}/api/avis`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<Avis[]> {
    return this.http.get<Avis[]>(this.apiUrl);
  }

  getById(id: number): Observable<Avis> {
    return this.http.get<Avis>(`${this.apiUrl}/${id}`);
  }

  create(avis: Avis): Observable<Avis> {
    return this.http.post<Avis>(this.apiUrl, avis);
  }

  update(id: number, avis: Avis): Observable<Avis> {
    return this.http.put<Avis>(`${this.apiUrl}/${id}`, avis);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  getStats(): Observable<AvisStats> {
    return this.http.get<AvisStats>(`${this.apiUrl}/stats`);
  }
}
