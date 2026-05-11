// src/app/core/services/face-verification.service.ts

import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface FaceVerificationResult {
  visageDetecte: boolean;
  message: string;
}

@Injectable({ providedIn: 'root' })
export class FaceVerificationService {
  
  private readonly API_URL = `${environment.apiUrl}/api/verification`;
  
  isVerifying = signal(false);
  lastResult = signal<FaceVerificationResult | null>(null);
  error = signal<string | null>(null);

  constructor(private http: HttpClient) {}

  /**
   * Vérifie si une photo contient un visage humain
   * @param file Le fichier image
   * @returns Promise avec le résultat
   */
  async verifierVisage(file: File): Promise<FaceVerificationResult> {
    this.isVerifying.set(true);
    this.error.set(null);
    
    try {
      const formData = new FormData();
      formData.append('photo', file, file.name);
      
      console.log('📤 Envoi de la photo pour vérification...', file.name);
      
      const result = await firstValueFrom(
        this.http.post<FaceVerificationResult>(`${this.API_URL}/visage`, formData)
      );
      
      this.lastResult.set(result);
      console.log('✅ Résultat vérification visage:', result);
      
      return result;
      
    } catch (err: any) {
      const errorMsg = err?.error?.erreur || err?.message || 'Erreur de vérification';
      this.error.set(errorMsg);
      console.error('❌ Erreur vérification visage:', err);
      
      return {
        visageDetecte: false,
        message: errorMsg
      };
    } finally {
      this.isVerifying.set(false);
    }
  }

  /**
   * Vérifie que le service backend est opérationnel
   */
  async healthCheck(): Promise<boolean> {
    try {
      const result = await firstValueFrom(
        this.http.get<{ statut: string }>(`${this.API_URL}/health`)
      );
      return result.statut === 'OK';
    } catch {
      return false;
    }
  }

  /**
   * Réinitialise l'état
   */
  reset(): void {
    this.isVerifying.set(false);
    this.lastResult.set(null);
    this.error.set(null);
  }
}
