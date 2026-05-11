import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ChambreDTO } from '../models/chambre';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ChambreService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/api/chambres`;

  getAll(): Observable<ChambreDTO[]> {
    return this.http.get<ChambreDTO[]>(this.apiUrl);
  }

  getById(id: number): Observable<ChambreDTO> {
    return this.http.get<ChambreDTO>(`${this.apiUrl}/${id}`);
  }

  create(dto: ChambreDTO): Observable<ChambreDTO> {
    return this.http.post<ChambreDTO>(this.apiUrl, dto);
  }

  update(dto: ChambreDTO): Observable<ChambreDTO> {
    return this.http.put<ChambreDTO>(this.apiUrl, dto);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
