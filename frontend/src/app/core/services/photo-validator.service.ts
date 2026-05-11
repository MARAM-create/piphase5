// src/app/core/services/photo-validator.service.ts

import { Injectable, signal } from '@angular/core';
import * as tf from '@tensorflow/tfjs';

export interface PhotoValidationResult {
  isValid: boolean;
  label: string;
  confidence: number;
}

export interface ValidatablePhoto {
  id: number;
  url: string;
  altText: string;
  ordre: number;
  dateUpload: string;
  validationStatus: 'pending' | 'validating' | 'valid' | 'invalid' | 'error';
  validationLabel?: string;
  validationConfidence?: number;
}

@Injectable({ providedIn: 'root' })
export class PhotoValidatorService {

  isModelLoading = signal(false);
  isModelReady   = signal(false);
  modelError     = signal<string | null>(null);

  // ── Type explicite pour éviter les erreurs TS ──
  private model: tf.LayersModel | tf.GraphModel | null = null;
  private loadPromise: Promise<void> | null = null;

  private readonly MODEL_URL =
    '/assets/models/room_classifier_tfjs/model.json';

  // ════════════════════════════════════════════════
  // CHARGEMENT DU MODÈLE
  // ════════════════════════════════════════════════
  async loadModel(): Promise<void> {
    if (this.model) return;
    if (this.loadPromise) { await this.loadPromise; return; }
    this.loadPromise = this._doLoad();
    await this.loadPromise;
  }

  private async _doLoad(): Promise<void> {
    this.isModelLoading.set(true);
    this.modelError.set(null);

    try {
      // ── Initialiser TF.js ──
      await tf.ready();
      console.log(`✅ TF.js prêt — backend: ${tf.getBackend()}`);

      // ── Charger le modèle (3 shards) ──
      console.log('📥 Chargement room_classifier_tfjs/model.json...');

      try {
        // Essai 1 : LayersModel (tfjs_layers_model)
        this.model = await tf.loadLayersModel(this.MODEL_URL);
        console.log('✅ Modèle chargé (LayersModel)');
      } catch (e1) {
        console.warn('⚠️ LayersModel échoué, essai GraphModel...');
        try {
          // Essai 2 : GraphModel (tfjs_graph_model)
          this.model = await tf.loadGraphModel(this.MODEL_URL);
          console.log('✅ Modèle chargé (GraphModel)');
        } catch (e2) {
          throw new Error(`Impossible de charger le modèle: ${e2}`);
        }
      }

      // ── Warmup ──
      const dummy = tf.zeros([1, 224, 224, 3]);
      const warmup = this.model.predict(dummy) as tf.Tensor;
      warmup.dispose();
      dummy.dispose();

      this.isModelReady.set(true);
      console.log('🚀 Modèle prêt pour la validation !');

    } catch (error: any) {
      console.error('❌ Erreur chargement:', error);
      this.modelError.set(error?.message ?? 'Modèle indisponible');
    } finally {
      this.isModelLoading.set(false);
    }
  }

  // ════════════════════════════════════════════════
  // VALIDATION D'UNE IMAGE
  // ════════════════════════════════════════════════
  async validateImage(base64Url: string): Promise<PhotoValidationResult> {
    await this.loadModel();

    if (!this.model) {
      return { isValid: true, label: 'Non vérifié', confidence: 0 };
    }

    return new Promise<PhotoValidationResult>((resolve) => {
      const img = new Image();

      img.onload = () => {
        // ── tf.tidy gère automatiquement la mémoire ──
        tf.tidy(() => {
          try {
            // ── Préprocessing : Image → Tensor [1, 224, 224, 3] ──
            const tensor = tf.browser
              .fromPixels(img)           // [H, W, 3]
              .resizeBilinear([224, 224]) // [224, 224, 3]
              .toFloat()
              .div(tf.scalar(255))       // [0, 1]
              .expandDims(0);            // [1, 224, 224, 3]

            // ── Inférence ──
            const prediction = this.model!.predict(tensor) as tf.Tensor;

            // ── Lire les scores (async hors de tidy) ──
            prediction.data().then((scores: Float32Array | Int32Array | Uint8Array) => {
              this.interpretScores(scores, resolve);
            }).catch(() => {
              resolve({ isValid: true, label: 'Erreur analyse', confidence: 0 });
            });

          } catch (err) {
            console.error('❌ Erreur inférence:', err);
            resolve({ isValid: true, label: 'Erreur analyse', confidence: 0 });
          }
        });
      };

      img.onerror = () => {
        resolve({ isValid: true, label: 'Erreur image', confidence: 0 });
      };

      img.src = base64Url;
    });
  }

  // ════════════════════════════════════════════════
  // INTERPRÉTATION DES SCORES
  // ════════════════════════════════════════════════
  private interpretScores(
    scores: Float32Array | Int32Array | Uint8Array,
    resolve: (result: PhotoValidationResult) => void
  ): void {
    let roomScore: number;

    if (scores.length === 1) {
      // ── Sortie sigmoid (binary) ──
      // 0 → not_room, 1 → room
      roomScore = scores[0];
    } else if (scores.length === 2) {
      // ── Sortie softmax 2 classes ──
      // class_indices: {'not_room': 0, 'room': 1}
      roomScore = scores[1];
    } else {
      // ── Plusieurs classes → chercher le max ──
      roomScore = Math.max(...Array.from(scores));
    }

    const isRoom    = roomScore > 0.5;
    const notRoom   = 1 - roomScore;
    const dominantScore = isRoom ? roomScore : notRoom;
    const confidence = Math.round(dominantScore * 100);

    console.log(
      `🔍 room=${(roomScore * 100).toFixed(1)}% ` +
      `not_room=${(notRoom * 100).toFixed(1)}% ` +
      `→ ${isRoom ? '✅ ROOM' : '❌ NOT ROOM'} (${confidence}%)`
    );

    resolve({
      isValid:    isRoom,
      label:      isRoom ? 'Logement détecté' : 'Pas un logement',
      confidence
    });
  }

  // ════════════════════════════════════════════════
  // LIBÉRER LA MÉMOIRE
  // ════════════════════════════════════════════════
  disposeModel(): void {
    this.model?.dispose();
    this.model = null;
    this.isModelReady.set(false);
  }
}
