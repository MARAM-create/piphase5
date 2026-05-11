import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface QuestionnaireDTO {
  universite?: string;
  filiere?: string;
  niveauEtude?: string;
  descriptionPersonnelle?: string;
  hobbies?: string[];
  horaireType?: 'matinal' | 'nocturne' | 'flexible';
  niveauProprete?: 'tres_organise' | 'moyen' | 'relaxe';
  frequenceInvites?: 'jamais' | 'occasionnel' | 'souvent';
  fumeur?: boolean;
  accepteFumeur?: boolean;
  aAnimaux?: boolean;
  accepteAnimaux?: boolean;
  villeRecherche?: string;
  budgetMax?: number;
  budgetMaxColocation?: number;
  villeRechercheColocation?: string;
  trancheAgeRecherche?: '18-22' | '23-27' | '28-35';
  sexePrefere?: 'homme' | 'femme' | 'indifferent';
  memeUniversitePrefere?: boolean;
}

export interface MatchColocataireDTO {
  utilisateurId: number;
  nom: string;
  prenom: string;
  photoProfil?: string;
  age?: number;
  universite?: string;
  filiere?: string;
  villeRecherche?: string;
  budgetMax?: number;
  scoreCompatibilite: number;
  hobbies?: string[];
  descriptionPersonnelle?: string;
  pointsCommuns: string[];
}

export interface MatchingResponse {
  matches: MatchColocataireDTO[];
  total: number;
  message?: string;
}

export interface StatutResponse {
  questionnaireComplete: boolean;
  nombreMatchesDisponibles: number;
}

@Injectable({
  providedIn: 'root'
})
export class MatchingService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/api/matching`;

  sauvegarderQuestionnaire(questionnaire: QuestionnaireDTO): Observable<{ success: boolean; message: string }> {
    return this.http.post<{ success: boolean; message: string }>(
      `${this.apiUrl}/questionnaire`,
      questionnaire
    );
  }

  trouverMatches(limit: number = 10): Observable<MatchingResponse> {
    return this.http.get<MatchingResponse>(`${this.apiUrl}/trouver?limit=${limit}`);
  }

  verifierStatut(): Observable<StatutResponse> {
    return this.http.get<StatutResponse>(`${this.apiUrl}/statut`);
  }

  contacter(destinataireId: number, message: string): Observable<{ success: boolean; message: string }> {
    return this.http.post<{ success: boolean; message: string }>(
      `${this.apiUrl}/contacter/${destinataireId}`,
      { message }
    );
  }
}
