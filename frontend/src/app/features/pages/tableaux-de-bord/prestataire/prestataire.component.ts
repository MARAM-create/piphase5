import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import {
  Utilisateur,
  ProfilPrestataire
} from '../../../../core/models/utilisateur.model';
import { environment } from '../../../../../environments/environment';

/* Prestataire = accent ORANGE #f47c20 (comme dans la photo de référence) */

@Component({
  selector: 'app-prestataire',
  standalone: true,
  imports: [CommonModule, FormsModule],
  styles: [`
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap');
    :host, * { font-family: 'Plus Jakarta Sans', sans-serif; box-sizing: border-box; }
    .champ-label {
      display: block; font-size: 11px; font-weight: 700;
      text-transform: uppercase; letter-spacing: .06em; color: #6b7280; margin-bottom: 5px;
    }
    .champ-input {
      width: 100%; padding: 10px 13px; border-radius: 10px;
      border: 1.5px solid #e5e7eb; background: #fafafa;
      font-size: 13.5px; color: #111827; outline: none;
      font-family: inherit; transition: border-color .15s, box-shadow .15s;
    }
    .champ-input:focus {
      border-color: #f47c20; box-shadow: 0 0 0 3px rgba(244,124,32,.08); background: #fff;
    }
    select.champ-input { cursor: pointer; }
  `],
  template: `
  <div class="min-h-screen flex flex-col" style="background:#f4f7f5;font-family:'Plus Jakarta Sans',sans-serif">

    <!-- ══ CONTENU ══ -->
    <div class="flex-1 flex flex-col min-w-0">
      <header class="bg-white border-b px-8 py-4 sticky top-0 z-30" style="border-color:#e8f0ea">
        <h1 class="text-lg font-black" style="color:#111827">{{titres[onglet]}}</h1>
        <p class="text-xs" style="color:#9ca3af">Locavia · Espace Prestataire</p>
      </header>

      <main class="flex-1 p-8 overflow-y-auto">

        <!-- ══ NOTIFICATION PROFIL INCOMPLET ══ -->
        <div *ngIf="champsManquants.length > 0 && !notifProfilFermee && onglet !== 'profil'"
          style="margin-bottom:24px;border-radius:20px;border:1px solid rgba(251,191,36,0.35);
                 background:linear-gradient(135deg,rgba(255,251,235,0.97),rgba(254,243,199,0.95));
                 box-shadow:0 4px 24px rgba(251,191,36,0.12)">
          <div style="padding:20px 24px">
            <div style="display:flex;align-items:flex-start;gap:16px">
              <div style="flex-shrink:0;width:52px;height:52px;border-radius:16px;
                          background:linear-gradient(135deg,#f59e0b,#fbbf24);
                          display:flex;align-items:center;justify-content:center;font-size:26px;
                          box-shadow:0 4px 14px rgba(251,191,36,0.4)">⚠️</div>
              <div style="flex:1;min-width:0">
                <div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:10px">
                  <div>
                    <h4 style="font-size:15px;font-weight:900;color:#92400e;margin:0 0 2px">Profil incomplet</h4>
                    <p style="font-size:12px;color:#b45309;margin:0">Certains champs requis sont manquants — complétez-les pour accéder à toutes les fonctionnalités</p>
                  </div>
                  <div style="display:flex;align-items:center;gap:10px;flex-shrink:0;margin-left:16px">
                    <div style="background:#fff;border-radius:100px;padding:4px 14px;border:1px solid rgba(251,191,36,0.4)">
                      <span style="font-size:13px;font-weight:900;color:#d97706">{{profilCompletude}}%</span>
                    </div>
                    <button (click)="notifProfilFermee=true"
                      style="width:28px;height:28px;border-radius:8px;border:none;cursor:pointer;
                             background:rgba(251,191,36,0.2);color:#92400e;font-size:18px;line-height:1;
                             display:flex;align-items:center;justify-content:center">×</button>
                  </div>
                </div>
                <div style="width:100%;height:6px;background:rgba(251,191,36,0.2);border-radius:100px;margin-bottom:14px">
                  <div style="height:6px;border-radius:100px;transition:width .5s;background:linear-gradient(90deg,#f59e0b,#fbbf24)"
                       [style.width]="profilCompletude+'%'"></div>
                </div>
                <div style="display:flex;flex-wrap:wrap;gap:8px;align-items:center">
                  <span style="font-size:11px;color:#92400e;font-weight:700">Compléter :</span>
                  <button *ngFor="let champ of champsManquants"
                    (click)="onglet='profil'; sousOnglet=champ.sousTab"
                    style="display:inline-flex;align-items:center;gap:5px;padding:5px 12px;border-radius:100px;
                           border:1.5px solid rgba(251,191,36,0.45);background:rgba(255,255,255,0.8);
                           font-size:12px;font-weight:700;color:#92400e;cursor:pointer">
                    {{champ.icone}} {{champ.label}} →
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- ══ PROFIL ══ -->
        <div *ngIf="onglet === 'profil'" class="max-w-3xl mx-auto space-y-6">

          <!-- Sous-onglets -->
          <div class="flex gap-2 bg-white rounded-2xl p-2 w-fit mx-auto" style="border:1px solid #e8f0ea">
            <button *ngFor="let s of sousOnglets" (click)="sousOnglet = s.cle"
              class="px-5 py-2.5 rounded-xl text-sm font-bold transition"
              [style.background]="sousOnglet === s.cle ? '#f47c20' : 'transparent'"
              [style.color]="sousOnglet === s.cle ? '#fff' : '#6b7280'">
              {{s.icone}} {{s.libelle}}
            </button>
          </div>

          <!-- ── PHOTO ── -->
          <div *ngIf="sousOnglet === 'photo'"
            style="position:relative;border-radius:28px;overflow:hidden;min-height:520px;
                   display:flex;align-items:center;justify-content:center">
            <video autoplay muted loop playsinline
              style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;
                     filter:blur(8px) brightness(0.48);transform:scale(1.1);z-index:0">
              <source src="assets/videos/2.mp4" type="video/mp4">
            </video>
            <div style="position:absolute;inset:0;z-index:1;
                        background:linear-gradient(135deg,rgba(40,15,0,0.65) 0%,rgba(0,0,0,0.3) 100%)"></div>
            <div style="position:relative;z-index:2;width:calc(100% - 80px);margin:40px auto;
                        background:rgba(255,255,255,0.10);
                        backdrop-filter:blur(30px) saturate(180%);
                        -webkit-backdrop-filter:blur(30px) saturate(180%);
                        border:1px solid rgba(255,255,255,0.18);
                        border-radius:24px;
                        box-shadow:0 32px 80px rgba(0,0,0,0.35),0 0 0 1px rgba(255,255,255,0.06),
                                   inset 0 1px 0 rgba(255,255,255,0.18);
                        padding:40px">
              <div style="display:flex;align-items:center;gap:14px;margin-bottom:32px">
                <div style="width:50px;height:50px;border-radius:16px;flex-shrink:0;
                            background:rgba(255,255,255,0.12);border:1px solid rgba(255,255,255,0.15);
                            display:flex;align-items:center;justify-content:center;font-size:26px;
                            box-shadow:0 4px 20px rgba(0,0,0,0.2)">📷</div>
                <div>
                  <h3 style="color:#fff;font-size:20px;font-weight:900;line-height:1.2;margin:0">Photo de profil</h3>
                  <p style="color:rgba(255,255,255,0.5);font-size:12px;margin:4px 0 0">Votre identité visuelle sur Locavia</p>
                </div>
                <div style="margin-left:auto;display:flex;gap:8px;flex-shrink:0">
                  <span style="background:rgba(220,38,38,0.18);color:#fca5a5;
                               border:1px solid rgba(220,38,38,0.3);
                               padding:4px 12px;border-radius:100px;font-size:11px;font-weight:700">Obligatoire</span>
                  <span style="background:rgba(124,58,237,0.18);color:#c4b5fd;
                               border:1px solid rgba(124,58,237,0.3);
                               padding:4px 12px;border-radius:100px;font-size:11px;font-weight:700">🤖 IA</span>
                </div>
              </div>
              <div style="display:flex;align-items:flex-start;gap:28px">
                <div style="flex-shrink:0;display:flex;flex-direction:column;align-items:center;gap:10px">
                  <div style="width:148px;height:148px;border-radius:24px;overflow:hidden;border:3px solid;
                              transition:border-color .3s;box-shadow:0 16px 40px rgba(0,0,0,0.4),
                              0 0 0 1px rgba(255,255,255,0.08)"
                       [style.border-color]="(utilisateur?.photoProfil || previewUrl) ? 'rgba(251,146,60,0.7)' : 'rgba(255,255,255,0.2)'">
                    <img *ngIf="previewUrl || utilisateur?.photoProfil"
                      [src]="previewUrl || utilisateur?.photoProfil"
                      style="width:100%;height:100%;object-fit:cover">
                    <div *ngIf="!previewUrl && !utilisateur?.photoProfil"
                      style="width:100%;height:100%;display:flex;flex-direction:column;align-items:center;
                             justify-content:center;background:rgba(255,255,255,0.04)">
                      <span style="font-size:48px">👤</span>
                      <p style="font-size:11px;color:rgba(255,255,255,0.4);margin-top:8px">Aucune photo</p>
                    </div>
                  </div>
                  <div *ngIf="utilisateur?.photoProfil"
                    style="padding:5px 14px;border-radius:100px;
                           background:rgba(251,146,60,0.15);border:1px solid rgba(251,146,60,0.3)">
                    <span style="font-size:11px;font-weight:700;color:#fb923c">✓ Vérifiée</span>
                  </div>
                </div>
                <div style="flex:1;min-width:0">
                  <div style="border:2px dashed;border-radius:20px;padding:32px 20px;text-align:center;
                              cursor:pointer;transition:all .2s"
                       [style.border-color]="isDragging ? '#fb923c' : 'rgba(255,255,255,0.22)'"
                       [style.background]="isDragging ? 'rgba(251,146,60,0.08)' : 'rgba(255,255,255,0.04)'"
                       (dragover)="onDragOver($event)" (dragleave)="isDragging=false"
                       (drop)="onDrop($event)" (click)="fileInput.click()">
                    <div style="width:52px;height:52px;border-radius:16px;background:rgba(255,255,255,0.1);
                                border:1px solid rgba(255,255,255,0.12);margin:0 auto 14px;
                                display:flex;align-items:center;justify-content:center;font-size:26px">☁️</div>
                    <p style="font-weight:700;font-size:15px;color:#fff;margin:0 0 6px">Glissez votre photo ici</p>
                    <p style="font-size:12px;color:rgba(255,255,255,0.45);margin:0 0 4px">ou cliquez pour choisir</p>
                    <p style="font-size:11px;color:rgba(255,255,255,0.28);margin:0">JPG · PNG · WebP · Max 5MB</p>
                  </div>
                  <input #fileInput type="file" accept="image/jpeg,image/png,image/webp"
                    style="display:none" (change)="onFichierChoisi($event)">
                  <div *ngIf="uploadEnCours" style="margin-top:16px">
                    <div style="display:flex;justify-content:space-between;font-size:12px;
                                color:rgba(255,255,255,0.5);margin-bottom:8px">
                      <span>Envoi en cours...</span><span>{{progression}}%</span>
                    </div>
                    <div style="width:100%;border-radius:100px;height:5px;background:rgba(255,255,255,0.1)">
                      <div style="height:5px;border-radius:100px;transition:width .3s;
                                  background:linear-gradient(90deg,#c2410c,#f47c20)"
                           [style.width]="progression+'%'"></div>
                    </div>
                  </div>
                  <div *ngIf="erreurPhoto"
                    style="margin-top:12px;padding:12px 16px;border-radius:14px;font-size:13px;
                           background:rgba(220,38,38,0.15);border:1px solid rgba(220,38,38,0.3);color:#fca5a5">
                    ⚠️ {{erreurPhoto}}
                  </div>
                  <div *ngIf="succesPhoto"
                    style="margin-top:12px;padding:12px 16px;border-radius:14px;font-size:13px;
                           background:rgba(251,146,60,0.15);border:1px solid rgba(251,146,60,0.3);color:#fb923c">
                    ✅ {{succesPhoto}}
                  </div>
                  <div style="display:flex;gap:10px;margin-top:16px">
                    <button *ngIf="fichierSelectionne && !uploadEnCours"
                      (click)="uploaderPhoto()"
                      style="flex:1;padding:14px 20px;border-radius:16px;font-size:14px;font-weight:700;
                             color:#fff;border:none;cursor:pointer;
                             background:linear-gradient(135deg,#c2410c,#f47c20);
                             box-shadow:0 8px 24px rgba(244,124,32,0.35)">
                      📤 Envoyer la photo
                    </button>
                  </div>
                  <p style="font-size:11px;color:rgba(255,255,255,0.35);text-align:center;margin-top:12px">
                    🤖 Analysée par IA · Visage humain requis
                  </p>
                </div>
              </div>
            </div>
          </div>

          <!-- ── IDENTITÉ ── -->
          <div *ngIf="sousOnglet === 'infos'"
            style="position:relative;border-radius:28px;overflow:hidden;min-height:520px;
                   display:flex;align-items:center;justify-content:center">
            <video autoplay muted loop playsinline
              style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;
                     filter:blur(8px) brightness(0.48);transform:scale(1.1);z-index:0">
              <source src="assets/videos/2.mp4" type="video/mp4">
            </video>
            <div style="position:absolute;inset:0;z-index:1;
                        background:linear-gradient(135deg,rgba(40,15,0,0.65) 0%,rgba(0,0,0,0.3) 100%)"></div>
            <div style="position:relative;z-index:2;width:calc(100% - 80px);margin:40px auto;
                        background:rgba(255,255,255,0.10);
                        backdrop-filter:blur(30px) saturate(180%);
                        -webkit-backdrop-filter:blur(30px) saturate(180%);
                        border:1px solid rgba(255,255,255,0.18);
                        border-radius:24px;
                        box-shadow:0 32px 80px rgba(0,0,0,0.35),0 0 0 1px rgba(255,255,255,0.06),
                                   inset 0 1px 0 rgba(255,255,255,0.18);
                        padding:40px">
              <div style="display:flex;align-items:center;gap:14px;margin-bottom:32px">
                <div style="width:50px;height:50px;border-radius:16px;flex-shrink:0;
                            background:rgba(255,255,255,0.12);border:1px solid rgba(255,255,255,0.15);
                            display:flex;align-items:center;justify-content:center;font-size:26px;
                            box-shadow:0 4px 20px rgba(0,0,0,0.2)">👤</div>
                <div>
                  <h3 style="color:#fff;font-size:20px;font-weight:900;line-height:1.2;margin:0">Informations personnelles</h3>
                  <p style="color:rgba(255,255,255,0.5);font-size:12px;margin:4px 0 0">Vos coordonnées et données d'identité</p>
                </div>
                <div style="margin-left:auto;flex-shrink:0">
                  <div style="width:72px;height:72px;border-radius:20px;overflow:hidden;
                              border:3px solid rgba(255,255,255,0.25);box-shadow:0 8px 24px rgba(0,0,0,0.3)">
                    <img *ngIf="utilisateur?.photoProfil" [src]="utilisateur?.photoProfil"
                      style="width:100%;height:100%;object-fit:cover">
                    <div *ngIf="!utilisateur?.photoProfil"
                      style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;
                             background:rgba(255,255,255,0.08);font-size:32px">👤</div>
                  </div>
                </div>
              </div>
              <div *ngIf="!enEditionInfos">
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:14px">
                  <div style="background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.12);border-radius:14px;padding:16px">
                    <p style="font-size:11px;text-transform:uppercase;font-weight:700;letter-spacing:.06em;color:rgba(255,255,255,0.45);margin:0 0 6px">Prénom</p>
                    <p style="font-weight:700;font-size:15px;color:#fff;margin:0">{{utilisateur?.prenom || '—'}}</p>
                  </div>
                  <div style="background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.12);border-radius:14px;padding:16px">
                    <p style="font-size:11px;text-transform:uppercase;font-weight:700;letter-spacing:.06em;color:rgba(255,255,255,0.45);margin:0 0 6px">Nom</p>
                    <p style="font-weight:700;font-size:15px;color:#fff;margin:0">{{utilisateur?.nom || '—'}}</p>
                  </div>
                  <div style="background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.12);border-radius:14px;padding:16px">
                    <p style="font-size:11px;text-transform:uppercase;font-weight:700;letter-spacing:.06em;color:rgba(255,255,255,0.45);margin:0 0 6px">Téléphone</p>
                    <p style="font-weight:700;font-size:15px;color:#fff;margin:0">{{utilisateur?.telephone || '—'}}</p>
                  </div>
                  <div style="background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.12);border-radius:14px;padding:16px">
                    <p style="font-size:11px;text-transform:uppercase;font-weight:700;letter-spacing:.06em;color:rgba(255,255,255,0.45);margin:0 0 6px">Membre depuis</p>
                    <p style="font-weight:700;font-size:15px;color:#fff;margin:0">{{utilisateur?.creeLe | date:'MMMM yyyy'}}</p>
                  </div>
                </div>
                <div style="background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.12);border-radius:14px;padding:16px;margin-bottom:20px">
                  <p style="font-size:11px;text-transform:uppercase;font-weight:700;letter-spacing:.06em;color:rgba(255,255,255,0.45);margin:0 0 6px">Bio</p>
                  <p style="font-size:14px;color:rgba(255,255,255,0.8);margin:0;line-height:1.5">{{utilisateur?.bio || '—'}}</p>
                </div>
                <button (click)="activerEditionInfos()"
                  style="background:linear-gradient(135deg,#c2410c,#f47c20);color:#fff;
                         padding:13px 28px;border-radius:14px;font-size:14px;font-weight:700;
                         border:none;cursor:pointer;box-shadow:0 8px 24px rgba(244,124,32,0.35)">
                  ✏️ Modifier mes informations
                </button>
              </div>
              <div *ngIf="enEditionInfos" style="display:flex;flex-direction:column;gap:16px">
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
                  <div>
                    <label style="display:block;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:rgba(255,255,255,0.6);margin-bottom:6px">Prénom <span style="color:#f87171">*</span></label>
                    <input [(ngModel)]="editionInfos.prenom"
                      style="width:100%;padding:12px 16px;border-radius:12px;font-size:14px;background:rgba(255,255,255,0.1);border:1.5px solid rgba(255,255,255,0.2);color:#fff;outline:none;font-family:inherit;box-sizing:border-box"
                      placeholder="Votre prénom">
                  </div>
                  <div>
                    <label style="display:block;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:rgba(255,255,255,0.6);margin-bottom:6px">Nom <span style="color:#f87171">*</span></label>
                    <input [(ngModel)]="editionInfos.nom"
                      style="width:100%;padding:12px 16px;border-radius:12px;font-size:14px;background:rgba(255,255,255,0.1);border:1.5px solid rgba(255,255,255,0.2);color:#fff;outline:none;font-family:inherit;box-sizing:border-box"
                      placeholder="Votre nom">
                  </div>
                </div>
                <div>
                  <label style="display:block;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:rgba(255,255,255,0.6);margin-bottom:6px">Téléphone <span style="color:#f87171">*</span></label>
                  <input [(ngModel)]="editionInfos.telephone"
                    style="width:100%;padding:12px 16px;border-radius:12px;font-size:14px;background:rgba(255,255,255,0.1);border:1.5px solid rgba(255,255,255,0.2);color:#fff;outline:none;font-family:inherit;box-sizing:border-box"
                    placeholder="+216 XX XXX XXX">
                </div>
                <div>
                  <label style="display:block;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:rgba(255,255,255,0.6);margin-bottom:6px">Bio</label>
                  <textarea [(ngModel)]="editionInfos.bio" rows="3"
                    style="width:100%;padding:12px 16px;border-radius:12px;font-size:14px;background:rgba(255,255,255,0.1);border:1.5px solid rgba(255,255,255,0.2);color:#fff;outline:none;font-family:inherit;resize:none;box-sizing:border-box"
                    placeholder="Parlez un peu de vous..."></textarea>
                </div>
                <div *ngIf="erreurProfil"
                  style="padding:12px 16px;border-radius:14px;font-size:13px;background:rgba(220,38,38,0.15);border:1px solid rgba(220,38,38,0.3);color:#fca5a5">
                  ⚠️ {{erreurProfil}}
                </div>
                <div style="display:flex;gap:12px">
                  <button (click)="sauvegarderInfos()" [disabled]="sauvegardEnCours"
                    style="background:linear-gradient(135deg,#c2410c,#f47c20);color:#fff;padding:13px 28px;border-radius:14px;font-size:14px;font-weight:700;border:none;cursor:pointer;box-shadow:0 8px 24px rgba(244,124,32,0.35)">
                    {{sauvegardEnCours ? '⏳ Sauvegarde...' : '💾 Sauvegarder'}}
                  </button>
                  <button (click)="enEditionInfos=false"
                    style="padding:13px 28px;border-radius:14px;font-size:14px;font-weight:700;cursor:pointer;border:1px solid rgba(255,255,255,0.25);background:rgba(255,255,255,0.08);color:rgba(255,255,255,0.7)">
                    Annuler
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- ── PROFIL PRESTATAIRE ── -->
          <div *ngIf="sousOnglet === 'services'"
            style="position:relative;border-radius:28px;overflow:hidden;min-height:520px;
                   display:flex;align-items:center;justify-content:center">
            <video autoplay muted loop playsinline
              style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;
                     filter:blur(8px) brightness(0.48);transform:scale(1.1);z-index:0">
              <source src="assets/videos/2.mp4" type="video/mp4">
            </video>
            <div style="position:absolute;inset:0;z-index:1;
                        background:linear-gradient(135deg,rgba(40,15,0,0.65) 0%,rgba(0,0,0,0.3) 100%)"></div>
            <div style="position:relative;z-index:2;width:calc(100% - 80px);margin:40px auto;
                        background:rgba(255,255,255,0.10);
                        backdrop-filter:blur(30px) saturate(180%);
                        -webkit-backdrop-filter:blur(30px) saturate(180%);
                        border:1px solid rgba(255,255,255,0.18);
                        border-radius:24px;
                        box-shadow:0 32px 80px rgba(0,0,0,0.35),0 0 0 1px rgba(255,255,255,0.06),
                                   inset 0 1px 0 rgba(255,255,255,0.18);
                        padding:40px">
              <div style="display:flex;align-items:center;gap:14px;margin-bottom:32px">
                <div style="width:50px;height:50px;border-radius:16px;flex-shrink:0;
                            background:rgba(255,255,255,0.12);border:1px solid rgba(255,255,255,0.15);
                            display:flex;align-items:center;justify-content:center;font-size:26px;
                            box-shadow:0 4px 20px rgba(0,0,0,0.2)">🔧</div>
                <div>
                  <h3 style="color:#fff;font-size:20px;font-weight:900;line-height:1.2;margin:0">Profil Prestataire</h3>
                  <p style="color:rgba(255,255,255,0.5);font-size:12px;margin:4px 0 0">Vos compétences et conditions de service</p>
                </div>
                <div style="margin-left:auto;flex-shrink:0" *ngIf="!enEditionPrestataire">
                  <button (click)="enEditionPrestataire=true; copierVersEdit()"
                    style="background:rgba(255,255,255,0.12);border:1px solid rgba(255,255,255,0.2);
                           color:rgba(255,255,255,0.85);padding:9px 20px;border-radius:12px;
                           font-size:13px;font-weight:700;cursor:pointer">✏️ Modifier</button>
                </div>
              </div>
              <!-- Vue -->
              <div *ngIf="!enEditionPrestataire">
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px">
                  <div *ngFor="let f of champsVuePresta"
                    style="background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.12);
                           border-radius:14px;padding:16px;display:flex;align-items:flex-start;gap:12px">
                    <span style="font-size:22px;line-height:1;margin-top:2px;flex-shrink:0">{{f.icone}}</span>
                    <div style="min-width:0">
                      <p style="font-size:11px;text-transform:uppercase;font-weight:700;letter-spacing:.06em;color:rgba(255,255,255,0.45);margin:0 0 4px">{{f.label}}</p>
                      <p style="font-weight:700;font-size:14px;color:#fff;margin:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">{{f.valeur || '—'}}</p>
                    </div>
                  </div>
                </div>
                <div style="background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.12);border-radius:14px;padding:16px">
                  <p style="font-size:11px;text-transform:uppercase;font-weight:700;letter-spacing:.06em;color:rgba(255,255,255,0.45);margin:0 0 6px">Certifications</p>
                  <p style="font-size:14px;color:rgba(255,255,255,0.8);margin:0;line-height:1.5">{{profil.certifications || '—'}}</p>
                </div>
              </div>
              <!-- Édition -->
              <div *ngIf="enEditionPrestataire" style="display:flex;flex-direction:column;gap:16px">
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
                  <div>
                    <label style="display:block;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:rgba(255,255,255,0.6);margin-bottom:6px">Spécialité <span style="color:#f87171">*</span></label>
                    <select [(ngModel)]="profilEdit.specialite"
                      style="width:100%;padding:12px 16px;border-radius:12px;font-size:14px;background:rgba(30,15,0,0.85);border:1.5px solid rgba(255,255,255,0.2);color:#fff;outline:none;font-family:inherit;box-sizing:border-box;cursor:pointer">
                      <option value="" style="background:#2a1000">Choisir...</option>
                      <option value="Plomberie" style="background:#2a1000">Plomberie</option>
                      <option value="Électricité" style="background:#2a1000">Électricité</option>
                      <option value="Peinture" style="background:#2a1000">Peinture</option>
                      <option value="Menuiserie" style="background:#2a1000">Menuiserie</option>
                      <option value="Climatisation" style="background:#2a1000">Climatisation</option>
                      <option value="Nettoyage" style="background:#2a1000">Nettoyage</option>
                      <option value="Jardinage" style="background:#2a1000">Jardinage</option>
                      <option value="Déménagement" style="background:#2a1000">Déménagement</option>
                      <option value="Sécurité" style="background:#2a1000">Sécurité</option>
                      <option value="Autre" style="background:#2a1000">Autre</option>
                    </select>
                  </div>
                  <div>
                    <label style="display:block;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:rgba(255,255,255,0.6);margin-bottom:6px">Années d'expérience</label>
                    <input [(ngModel)]="profilEdit.experienceAnnees" type="number"
                      style="width:100%;padding:12px 16px;border-radius:12px;font-size:14px;background:rgba(255,255,255,0.1);border:1.5px solid rgba(255,255,255,0.2);color:#fff;outline:none;font-family:inherit;box-sizing:border-box"
                      placeholder="Ex: 5">
                  </div>
                  <div>
                    <label style="display:block;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:rgba(255,255,255,0.6);margin-bottom:6px">Zone d'intervention</label>
                    <input [(ngModel)]="profilEdit.zoneIntervention"
                      style="width:100%;padding:12px 16px;border-radius:12px;font-size:14px;background:rgba(255,255,255,0.1);border:1.5px solid rgba(255,255,255,0.2);color:#fff;outline:none;font-family:inherit;box-sizing:border-box"
                      placeholder="Ex: Grand Tunis, Sfax...">
                  </div>
                  <div>
                    <label style="display:block;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:rgba(255,255,255,0.6);margin-bottom:6px">Tarif horaire (DT/h)</label>
                    <input [(ngModel)]="profilEdit.tarifHoraire" type="number"
                      style="width:100%;padding:12px 16px;border-radius:12px;font-size:14px;background:rgba(255,255,255,0.1);border:1.5px solid rgba(255,255,255,0.2);color:#fff;outline:none;font-family:inherit;box-sizing:border-box"
                      placeholder="Ex: 30">
                  </div>
                  <div>
                    <label style="display:block;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:rgba(255,255,255,0.6);margin-bottom:6px">Disponibilité</label>
                    <select [(ngModel)]="profilEdit.disponibilite"
                      style="width:100%;padding:12px 16px;border-radius:12px;font-size:14px;background:rgba(30,15,0,0.85);border:1.5px solid rgba(255,255,255,0.2);color:#fff;outline:none;font-family:inherit;box-sizing:border-box;cursor:pointer">
                      <option value="" style="background:#2a1000">Choisir...</option>
                      <option value="Lun-Ven 8h-17h" style="background:#2a1000">Lun-Ven 8h-17h</option>
                      <option value="Lun-Sam 8h-18h" style="background:#2a1000">Lun-Sam 8h-18h</option>
                      <option value="7j/7" style="background:#2a1000">7j/7</option>
                      <option value="Week-end uniquement" style="background:#2a1000">Week-end uniquement</option>
                      <option value="Sur rendez-vous" style="background:#2a1000">Sur rendez-vous</option>
                      <option value="Urgences 24h/24" style="background:#2a1000">Urgences 24h/24</option>
                    </select>
                  </div>
                  <div>
                    <label style="display:block;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:rgba(255,255,255,0.6);margin-bottom:6px">Site web (optionnel)</label>
                    <input [(ngModel)]="profilEdit.siteWeb"
                      style="width:100%;padding:12px 16px;border-radius:12px;font-size:14px;background:rgba(255,255,255,0.1);border:1.5px solid rgba(255,255,255,0.2);color:#fff;outline:none;font-family:inherit;box-sizing:border-box"
                      placeholder="https://monsite.com">
                  </div>
                </div>
                <div>
                  <label style="display:block;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:rgba(255,255,255,0.6);margin-bottom:6px">Certifications</label>
                  <textarea [(ngModel)]="profilEdit.certifications" rows="3"
                    style="width:100%;padding:12px 16px;border-radius:12px;font-size:14px;background:rgba(255,255,255,0.1);border:1.5px solid rgba(255,255,255,0.2);color:#fff;outline:none;font-family:inherit;resize:none;box-sizing:border-box"
                    placeholder="Ex: Certifié RGE, Licence professionnelle..."></textarea>
                </div>
                <div *ngIf="erreurSauvegardeProfil"
                  style="padding:12px 16px;border-radius:14px;font-size:13px;background:rgba(220,38,38,0.15);border:1px solid rgba(220,38,38,0.3);color:#fca5a5">
                  ⚠️ {{erreurSauvegardeProfil}}
                </div>
                <div style="display:flex;gap:12px">
                  <button (click)="sauvegarderProfil()" [disabled]="sauvegardEnCours"
                    style="background:linear-gradient(135deg,#c2410c,#f47c20);color:#fff;padding:13px 28px;border-radius:14px;font-size:14px;font-weight:700;border:none;cursor:pointer;box-shadow:0 8px 24px rgba(244,124,32,0.35)">
                    {{sauvegardEnCours ? '⏳ Sauvegarde...' : '💾 Sauvegarder'}}
                  </button>
                  <button (click)="enEditionPrestataire=false"
                    style="padding:13px 28px;border-radius:14px;font-size:14px;font-weight:700;cursor:pointer;border:1px solid rgba(255,255,255,0.25);background:rgba(255,255,255,0.08);color:rgba(255,255,255,0.7)">
                    Annuler
                  </button>
                </div>
              </div>
            </div>
          </div>

        </div>

        <!-- ══ DEMANDES ══ -->
        <div *ngIf="onglet === 'demandes'">
          <div *ngIf="!utilisateur?.photoProfil" class="rounded-2xl p-4 mb-6 flex items-center gap-3"
               style="background:#fff7ed;border:1px solid #fed7aa">
            <span class="text-2xl">⚠️</span>
            <div class="flex-1">
              <p class="font-bold text-sm" style="color:#9a3412">Photo de profil requise</p>
              <p class="text-xs" style="color:#c2410c">Ajoutez votre photo pour accéder à toutes les fonctionnalités</p>
            </div>
            <button (click)="onglet='profil'; sousOnglet='photo'"
              class="text-white px-4 py-2 rounded-xl text-xs font-bold" style="background:#f47c20">Ajouter →</button>
          </div>
          <div class="bg-white rounded-2xl p-16 text-center" style="border:1px solid #e8f0ea">
            <span class="text-5xl block mb-4">📋</span>
            <h3 class="text-xl font-black mb-2" style="color:#111827">Mes demandes</h3>
            <p class="text-sm" style="color:#9ca3af">Module à connecter.</p>
          </div>
        </div>

        <!-- ══ MESSAGERIE ══ -->
        <div *ngIf="onglet === 'messagerie'">
          <div class="bg-white rounded-2xl p-16 text-center" style="border:1px solid #e8f0ea">
            <span class="text-5xl block mb-4">💬</span>
            <h3 class="text-xl font-black mb-2" style="color:#111827">Messagerie</h3>
            <p class="text-sm" style="color:#9ca3af">Module à connecter.</p>
          </div>
        </div>

        <!-- ══ NOTIFICATIONS ══ -->
        <div *ngIf="onglet === 'notifications'"
          style="max-width:520px;margin:0 auto;background:#fff;border-radius:20px;
                 border:1px solid #e8f0ea;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.06)">
          <div style="display:flex;align-items:center;justify-content:space-between;padding:20px 24px;border-bottom:1px solid #f3f4f6">
            <h2 style="font-size:18px;font-weight:900;color:#111827;margin:0">Notifications</h2>
            <span *ngIf="champsManquants.length > 0"
              style="background:#dc2626;color:#fff;border-radius:100px;padding:2px 10px;font-size:12px;font-weight:700">
              {{champsManquants.length}}
            </span>
          </div>
          <div style="display:flex;gap:8px;padding:14px 24px;border-bottom:1px solid #f3f4f6">
            <span style="padding:6px 18px;border-radius:100px;font-size:13px;font-weight:700;background:#f47c20;color:#fff;cursor:default">Tout</span>
            <span style="padding:6px 18px;border-radius:100px;font-size:13px;font-weight:600;border:1.5px solid #e5e7eb;color:#6b7280;cursor:default">Non lues</span>
          </div>
          <div *ngIf="champsManquants.length === 0" style="padding:60px 24px;text-align:center">
            <div style="font-size:52px;margin-bottom:14px">🎉</div>
            <p style="font-size:15px;font-weight:700;color:#111827;margin:0 0 6px">Profil complet !</p>
            <p style="font-size:13px;color:#6b7280;margin:0">Aucune notification pour le moment.</p>
          </div>
          <div *ngIf="champsManquants.length > 0">
            <div style="padding:16px 24px 0;display:flex;align-items:center;gap:10px">
              <div style="flex:1;height:5px;background:#f3f4f6;border-radius:100px;overflow:hidden">
                <div style="height:5px;border-radius:100px;background:linear-gradient(90deg,#c2410c,#f47c20);transition:width .5s"
                     [style.width]="profilCompletude+'%'"></div>
              </div>
              <span style="font-size:12px;font-weight:700;color:#6b7280;white-space:nowrap">{{profilCompletude}}% complété</span>
            </div>
            <div *ngFor="let champ of champsManquants; let last = last"
              style="display:flex;align-items:center;gap:14px;padding:16px 24px"
              [style.border-bottom]="last ? 'none' : '1px solid #f9fafb'">
              <div style="width:46px;height:46px;border-radius:14px;background:#fff7ed;border:1px solid #fed7aa;
                          flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:22px">{{champ.icone}}</div>
              <div style="flex:1;min-width:0">
                <p style="font-size:14px;font-weight:700;color:#111827;margin:0 0 2px">{{champ.label}}</p>
                <p style="font-size:12px;color:#9ca3af;margin:0">Information obligatoire manquante</p>
              </div>
              <button (click)="onglet='profil'; sousOnglet=champ.sousTab"
                style="padding:7px 14px;border-radius:10px;border:none;cursor:pointer;font-size:12px;
                       font-weight:700;color:#f47c20;background:#fff7ed;white-space:nowrap;flex-shrink:0">
                Ajouter →
              </button>
            </div>
          </div>
          <div style="padding:16px 24px;border-top:1px solid #f3f4f6">
            <button (click)="onglet='profil'; sousOnglet='photo'"
              style="width:100%;padding:14px;border-radius:14px;border:none;cursor:pointer;
                     font-size:14px;font-weight:700;color:#fff;
                     background:linear-gradient(135deg,#c2410c,#f47c20);
                     box-shadow:0 4px 16px rgba(244,124,32,0.25)">
              Compléter mon profil
            </button>
          </div>
        </div>

      </main>
    </div>
  </div>

  `,
})
export class PrestataireComponent implements OnInit {

  onglet = 'profil';
  sousOnglet = 'photo';
  utilisateur: Utilisateur | null = null;

  enEditionInfos = false;
  editionInfos: any = {};
  erreurProfil = '';
  sauvegardEnCours = false;
  enEditionPrestataire = false;
  profil: ProfilPrestataire = {};
  profilEdit: ProfilPrestataire = {};
  erreurSauvegardeProfil = '';
  notifProfilFermee = false;

  fichierSelectionne: File | null = null;
  previewUrl = ''; uploadEnCours = false; progression = 0;
  erreurPhoto = ''; succesPhoto = ''; isDragging = false;

  navigation = [
    { cle: 'profil', libelle: 'Mon profil', icone: '👤' },
    { cle: 'demandes', libelle: 'Mes demandes', icone: '📋' },
    { cle: 'messagerie', libelle: 'Messagerie', icone: '💬' }
  ];
  sousOnglets = [
    { cle: 'photo', libelle: 'Photo', icone: '📷' },
    { cle: 'infos', libelle: 'Identité', icone: '👤' },
    { cle: 'services', libelle: 'Services', icone: '🔧' }
  ];
  titres: Record<string, string> = {
    profil: 'Mon profil', demandes: 'Mes demandes', messagerie: 'Messagerie', notifications: 'Notifications'
  };

  get champsManquants(): { label: string; sousTab: string; icone: string }[] {
    const m: { label: string; sousTab: string; icone: string }[] = [];
    if (!this.utilisateur?.photoProfil) m.push({ label: 'Photo de profil', sousTab: 'photo', icone: '📷' });
    if (!this.utilisateur?.telephone) m.push({ label: 'Téléphone', sousTab: 'infos', icone: '📱' });
    if (!this.profil.specialite) m.push({ label: 'Spécialité', sousTab: 'services', icone: '🔧' });
    if (!this.profil.zoneIntervention) m.push({ label: "Zone d'intervention", sousTab: 'services', icone: '📍' });
    return m;
  }

  get profilCompletude(): number {
    return Math.round(((4 - this.champsManquants.length) / 4) * 100);
  }

  get champsVuePresta() {
    return [
      { label: 'Spécialité', valeur: this.profil.specialite, icone: '🔧' },
      { label: 'Expérience', valeur: this.profil.experienceAnnees != null ? this.profil.experienceAnnees + ' ans' : null, icone: '📅' },
      { label: "Zone d'intervention", valeur: this.profil.zoneIntervention, icone: '📍' },
      { label: 'Tarif horaire', valeur: this.profil.tarifHoraire != null ? this.profil.tarifHoraire + ' DT/h' : null, icone: '💰' },
      { label: 'Disponibilité', valeur: this.profil.disponibilite, icone: '🕐' },
      { label: 'Site web', valeur: this.profil.siteWeb, icone: '🌐' }
    ];
  }


  private readonly API_PHOTO = `${environment.apiUrl}/api/utilisateurs`;
  private readonly API_PROFIL = `${environment.apiUrl}/api/profil`;

  constructor(
    public authService: AuthService,
    private http: HttpClient,
    private route: ActivatedRoute
  ) { }

  ngOnInit(): void {
    // Check for query params to set active tabs
    this.route.queryParams.subscribe(params => {
      if (params['onglet']) {
        this.onglet = params['onglet'];
      }
      if (params['sousOnglet']) {
        this.sousOnglet = params['sousOnglet'];
      }
    });

    this.utilisateur = this.authService.getSnapshot();
    this.authService.obtenirProfil().subscribe((u: Utilisateur) => {
      this.utilisateur = u; if (!u.photoProfil) this.sousOnglet = 'photo';
    });
    this.http.get<ProfilPrestataire>(`${this.API_PROFIL}/prestataire`)
      .subscribe((p: ProfilPrestataire) => { this.profil = p ?? {}; });
  }

  activerEditionInfos(): void {
    this.editionInfos = {
      prenom: this.utilisateur?.prenom, nom: this.utilisateur?.nom,
      telephone: this.utilisateur?.telephone, bio: this.utilisateur?.bio
    };
    this.enEditionInfos = true; this.erreurProfil = '';
  }
  sauvegarderInfos(): void {
    if (!this.editionInfos.prenom?.trim()) { this.erreurProfil = 'Le prénom est obligatoire.'; return; }
    if (!this.editionInfos.nom?.trim()) { this.erreurProfil = 'Le nom est obligatoire.'; return; }
    if (!this.editionInfos.telephone?.trim()) { this.erreurProfil = 'Le numéro de téléphone est obligatoire.'; return; }
    this.sauvegardEnCours = true;
    this.erreurProfil = '';
    this.authService.mettreAJourProfil(this.editionInfos).subscribe({
      next: (u: Utilisateur) => { this.utilisateur = u; this.enEditionInfos = false; this.sauvegardEnCours = false; },
      error: (e: any) => { this.erreurProfil = e?.error?.message ?? 'Erreur'; this.sauvegardEnCours = false; }
    });
  }
  copierVersEdit(): void { this.profilEdit = { ...this.profil }; this.erreurSauvegardeProfil = ''; }
  sauvegarderProfil(): void {
    if (!this.profilEdit.specialite?.trim()) { this.erreurSauvegardeProfil = 'La spécialité est obligatoire.'; return; }
    this.sauvegardEnCours = true;
    this.erreurSauvegardeProfil = '';
    this.http.put<ProfilPrestataire>(`${this.API_PROFIL}/prestataire`, this.profilEdit).subscribe({
      next: (p: ProfilPrestataire) => { this.profil = p; this.enEditionPrestataire = false; this.sauvegardEnCours = false; },
      error: () => { this.sauvegardEnCours = false; }
    });
  }
  onDragOver(e: DragEvent): void { e.preventDefault(); this.isDragging = true; }
  onDrop(e: DragEvent): void { e.preventDefault(); this.isDragging = false; const f = e.dataTransfer?.files[0]; if (f) this.traiterFichier(f); }
  onFichierChoisi(e: Event): void { const f = (e.target as HTMLInputElement).files?.[0]; if (f) this.traiterFichier(f); }
  traiterFichier(fichier: File): void {
    this.erreurPhoto = ''; this.succesPhoto = '';
    if (fichier.size > 5 * 1024 * 1024) { this.erreurPhoto = 'La photo ne doit pas dépasser 5MB'; return; }
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(fichier.type)) { this.erreurPhoto = 'Format non supporté'; return; }
    this.fichierSelectionne = fichier;
    const r = new FileReader(); r.onload = () => { this.previewUrl = r.result as string; }; r.readAsDataURL(fichier);
  }
  uploaderPhoto(): void {
    if (!this.fichierSelectionne) return;
    this.uploadEnCours = true; this.progression = 0;
    const fd = new FormData(); fd.append('photo', this.fichierSelectionne);
    const t = setInterval(() => { if (this.progression < 80) this.progression += 15; }, 200);
    this.http.post<{ urlPhoto: string; message: string }>(`${this.API_PHOTO}/photo`, fd).subscribe({
      next: res => {
        clearInterval(t); this.progression = 100; this.succesPhoto = res.message;
        this.uploadEnCours = false; this.fichierSelectionne = null;
        if (this.utilisateur) {
          this.utilisateur = { ...this.utilisateur, photoProfil: res.urlPhoto };
          this.authService.mettreAJourProfil({ photoProfil: res.urlPhoto }).subscribe();
        }
      },
      error: (e: any) => { clearInterval(t); this.uploadEnCours = false; this.progression = 0; this.erreurPhoto = e.error?.erreur ?? 'Erreur'; }
    });
  }
}
