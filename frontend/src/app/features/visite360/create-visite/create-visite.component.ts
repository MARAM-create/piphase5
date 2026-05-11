import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Visite360Component } from '../../../features/visite360/visite360.component';
import { ElementRef, ViewChild } from '@angular/core';
import { Visite3dService } from '../../../core/services/visite3d.service';
import {Router} from '@angular/router';



interface Lien3D {
  id: number;
  sourceId: number;
  targetId: number;
  texte: string;
  pitch: number;
  yaw: number;
}
interface Scene {
  id: number;
  titre: string;
  preview: string;
  file?: File;
  existingImageUrl?: string;
}


@Component({
  selector: 'app-create-visite',
  standalone: true,
  imports: [CommonModule, FormsModule, Visite360Component],
  templateUrl: './create-visite.component.html',
  styleUrls: ['./create-visite.component.scss']
})
export class CreateVisiteComponent {
  @ViewChild('previewBlock') previewBlock?: ElementRef<HTMLDivElement>;

  sceneSelectionneeId: number | null = null;
  scenes: Scene[] = [];
  scenes360Preview: any[] = [];
  visite: any = history.state?.visite || this.getVisiteDepuisStorage();
  etapeActuelle = 1;
  liens3D: Lien3D[] = [];

  sceneDepartId: number | null = null;
  sceneCibleId: number | null = null;

  pitchLien = 0;
  yawLien = 30;

  modeModification = false;
  visite3DExistante: any = history.state?.visite3DExistante || this.getVisite3DModificationStorage();


  constructor(
    private router: Router,
    private visite3dService: Visite3dService
  ) {}


  ngOnInit(): void {
    if (this.visite3DExistante) {
      this.modeModification = true;
      this.prechargerVisite3DExistante(this.visite3DExistante);
    }
  }

  prechargerVisite3DExistante(data: any): void {
    const scenes = data.scenes || [];
    const liens = data.liens || [];

    this.scenes = scenes.map((scene: any, index: number) => ({
      id: Number(scene.tempId) || Date.now() + index,
      titre: scene.titre || 'Nouvelle pièce',
      preview: this.visite3dService.toFullImageUrl(scene.imageUrl),
      existingImageUrl: scene.imageUrl
    }));

    this.liens3D = liens.map((lien: any) => ({
      id: Date.now() + Math.floor(Math.random() * 10000),
      sourceId: Number(lien.sourceId),
      targetId: Number(lien.targetId),
      texte: lien.texte,
      pitch: lien.pitch,
      yaw: lien.yaw
    }));

    this.sceneSelectionneeId = this.scenes[0]?.id || null;
    this.majPreview3D();

    // On ouvre directement à l'étape publication
    this.etapeActuelle = 5;
  }


  async ajouterScene(event: any): Promise<void> {
    const file = event.target.files[0];
    if (!file) return;

    const previewOptimise = await this.optimiserImage360(file);

    const scene: Scene = {
      id: Date.now(),
      titre: 'Nouvelle pièce',
      preview: URL.createObjectURL(file),
      file: file
    };

    this.scenes.push(scene);
    if (!this.sceneSelectionneeId) {
      this.sceneSelectionneeId = scene.id;
    }

    this.majPreview3D();
    if (!this.sceneSelectionneeId) {
      this.sceneSelectionneeId = scene.id;
    }
  }



  supprimerScene(id: number): void {
    this.scenes = this.scenes.filter(s => s.id !== id);

    if (this.sceneSelectionneeId === id) {
      this.sceneSelectionneeId = this.scenes.length > 0 ? this.scenes[0].id : null;
    }

    this.majPreview3D();
  }

  // 🔥 transformer vers format visite360
  getScenes360() {
    const sceneActive = this.sceneSelectionneeId
      ? this.scenes.find(s => s.id === this.sceneSelectionneeId)
      : this.scenes[0];

    if (!sceneActive) return [];

    return [
      {
        id: sceneActive.id.toString(),
        titre: sceneActive.titre,
        imageUrl: sceneActive.preview
      }
    ];
  }

  voirScene3D(scene: any): void {
    this.sceneSelectionneeId = scene.id;
    this.majPreview3D();

    setTimeout(() => {
      this.previewBlock?.nativeElement.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }, 100);
  }

  private optimiserImage360(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const image = new Image();
      const reader = new FileReader();

      reader.onload = () => {
        image.src = reader.result as string;
      };

      image.onload = () => {
        const maxWidth = 4096;
        const ratio = image.width / image.height;

        let width = image.width;
        let height = image.height;

        if (width > maxWidth) {
          width = maxWidth;
          height = Math.round(width / ratio);
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');

        if (!ctx) {
          reject('Canvas non supporté');
          return;
        }

        ctx.drawImage(image, 0, 0, width, height);

        const imageOptimisee = canvas.toDataURL('image/jpeg', 0.82);
        resolve(imageOptimisee);
      };

      image.onerror = () => reject('Erreur chargement image');
      reader.onerror = () => reject('Erreur lecture fichier');

      reader.readAsDataURL(file);
    });
  }

  majPreview3D(): void {
    if (!this.scenes || this.scenes.length === 0) {
      this.scenes360Preview = [];
      return;
    }

    const sceneActiveId = this.sceneSelectionneeId || this.scenes[0].id;

    const scenesOrdonnees = [
      ...this.scenes.filter(s => s.id === sceneActiveId),
      ...this.scenes.filter(s => s.id !== sceneActiveId)
    ];

    this.scenes360Preview = scenesOrdonnees.map(scene => {
      const hotspots = this.liens3D
        .filter(lien => lien.sourceId === scene.id)
        .map(lien => ({
          pitch: lien.pitch,
          yaw: lien.yaw,
          type: 'scene' as const,
          text: lien.texte,
          sceneId: lien.targetId.toString()
        }));

      return {
        id: scene.id.toString(),
        titre: scene.titre,
        imageUrl: scene.preview,
        hotspots
      };
    });
  }

  allerEtape(etape: number): void {
    this.etapeActuelle = etape;
  }



  allerOrganiser(): void {
    console.log('Bouton suivant cliqué');
    console.log('Nombre de scènes = ', this.scenes.length);

    if (this.scenes.length === 0) {
      return;
    }

    this.etapeActuelle = 2;
  }

  retourAjouterPieces(): void {
    this.etapeActuelle = 1;
  }

  selectionnerScene(scene: any): void {
    this.sceneSelectionneeId = scene.id;
    this.majPreview3D();
  }

  monterScene(index: number): void {
    if (index === 0) return;

    const temp = this.scenes[index - 1];
    this.scenes[index - 1] = this.scenes[index];
    this.scenes[index] = temp;

    this.majPreview3D();
  }

  descendreScene(index: number): void {
    if (index === this.scenes.length - 1) return;

    const temp = this.scenes[index + 1];
    this.scenes[index + 1] = this.scenes[index];
    this.scenes[index] = temp;

    this.majPreview3D();
  }

  allerLierPieces(): void {
    if (this.scenes.length < 2) {
      alert('Ajoutez au moins deux pièces pour créer une navigation.');
      return;
    }

    this.etapeActuelle = 3;

    this.sceneDepartId = this.scenes[0].id;
    this.sceneCibleId = this.scenes[1].id;
    this.sceneSelectionneeId = this.sceneDepartId;

    this.majPreview3D();
  }

  retourOrganiser(): void {
    this.etapeActuelle = 2;
  }

  selectionnerSceneDepart(): void {
    if (!this.sceneDepartId) return;

    this.sceneSelectionneeId = this.sceneDepartId;
    this.majPreview3D();
  }

  getSceneTitre(id: number | null): string {
    if (!id) return '—';
    return this.scenes.find(s => s.id === id)?.titre || 'Pièce';
  }

  ajouterLien(): void {
    if (!this.sceneDepartId || !this.sceneCibleId) {
      alert('Choisissez une pièce de départ et une pièce cible.');
      return;
    }

    if (this.sceneDepartId === this.sceneCibleId) {
      alert('La pièce de départ et la pièce cible doivent être différentes.');
      return;
    }

    const texte = 'Aller à ' + this.getSceneTitre(this.sceneCibleId);

    const lien: Lien3D = {
      id: Date.now(),
      sourceId: this.sceneDepartId,
      targetId: this.sceneCibleId,
      texte,
      pitch: this.pitchLien,
      yaw: this.yawLien
    };

    this.liens3D.push(lien);

    this.sceneSelectionneeId = this.sceneDepartId;
    this.majPreview3D();
  }

  supprimerLien(id: number): void {
    this.liens3D = this.liens3D.filter(l => l.id !== id);
    this.majPreview3D();
  }


  allerPrevisualiser(): void {
    if (this.scenes.length === 0) return;

    if (!this.sceneSelectionneeId && this.scenes[0]) {
      this.sceneSelectionneeId = this.scenes[0].id;
    }

    this.majPreview3D();
    this.etapeActuelle = 4;

    setTimeout(() => {
      this.previewBlock?.nativeElement.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }, 100);
  }

  allerPublier(): void {
    if (this.scenes.length === 0) return;

    this.majPreview3D();
    this.etapeActuelle = 5;
  }

  retourLierPieces(): void {
    this.etapeActuelle = 3;
  }

  retourPrevisualiser(): void {
    this.etapeActuelle = 4;
  }

  getSceneActive(): any | null {
    if (!this.sceneSelectionneeId) {
      return this.scenes[0] || null;
    }

    return this.scenes.find(s => s.id === this.sceneSelectionneeId) || this.scenes[0] || null;
  }

  getSceneActivePosition(): number {
    const active = this.getSceneActive();
    if (!active) return 0;

    const index = this.scenes.findIndex(s => s.id === active.id);
    return index >= 0 ? index + 1 : 1;
  }



  publierVisite3D(): void {
    if (this.scenes.length === 0) {
      alert('Ajoutez au moins une pièce avant de publier.');
      return;
    }

    if (!this.visite?.annonceId) {
      alert('Impossible de publier : annonce introuvable.');
      return;
    }
    const annonceId = Number(
      this.visite?.annonceId ??
      this.visite?.idAnnonce ??
      this.visite?.annonce?.idAnnonce ??
      this.visite?.annonce?.id
    );

    if (!annonceId || Number.isNaN(annonceId)) {
      console.error('VISITE SANS annonceId = ', this.visite);
      alert('Impossible de publier : annonce introuvable.');
      return;
    }
    const files: File[] = [];

    const scenesMetadata = this.scenes.map((scene, index) => {
      const sceneMeta: any = {
        tempId: String(scene.id),
        titre: scene.titre || 'Nouvelle pièce',
        ordre: index + 1
      };

      // Nouvelle image ajoutée pendant cette création/modification
      if (scene.file) {
        sceneMeta.fileIndex = files.length;
        files.push(scene.file);
      }

      // Ancienne image déjà publiée, utilisée en mode modification
      else if (scene.existingImageUrl) {
        sceneMeta.existingImageUrl = scene.existingImageUrl;
      }

      // Sécurité
      else {
        console.warn('Scène sans image : ', scene);
      }

      return sceneMeta;
    });

    const sceneSansImage = scenesMetadata.some(scene =>
      scene.fileIndex === undefined && !scene.existingImageUrl
    );

    if (sceneSansImage) {
      alert('Une ou plusieurs pièces n’ont pas d’image. Veuillez vérifier avant de publier.');
      return;
    }

    const metadata = {
      annonceId: annonceId,
      demandeId: this.visite?.demandeId || null,

      titreAnnonce: this.visite?.titreAnnonce || 'Appartement sélectionné',
      nomEtudiant: this.visite?.nomEtudiant || '',
      dateVisite: this.visite?.dateVisite || '',

      scenes: scenesMetadata,

      liens: this.liens3D.map(lien => ({
        sourceId: String(lien.sourceId),
        targetId: String(lien.targetId),
        texte: lien.texte,
        pitch: lien.pitch,
        yaw: lien.yaw
      }))
    };

    console.log('metadata = ', metadata);
    console.log('scenes = ', this.scenes);
    console.log('files = ', files);
    console.log('nb scenes = ', this.scenes.length);
    console.log('nb files = ', files.length);

    this.visite3dService.publierVisite3D(metadata, files).subscribe({
      next: () => {
        alert(this.modeModification
          ? 'Visite 3D modifiée avec succès.'
          : 'Visite 3D publiée avec succès.'
        );

        localStorage.removeItem('visite3d_modification');

        this.router.navigate(['/visite-en-ligne']);
      },

      error: (err) => {
        console.error('ERREUR COMPLETE = ', err);
        console.error('STATUS = ', err?.status);
        console.error('STATUS TEXT = ', err?.statusText);
        console.error('ERROR BODY = ', err?.error);
        console.error('MESSAGE = ', err?.message);

        const message =
          typeof err?.error === 'string'
            ? err.error
            : err?.error?.message
              ? err.error.message
              : `Erreur publication 3D. Status = ${err?.status}`;

        alert(message);
      }
    });
  }






  private getVisiteDepuisStorage(): any | null {
    const saved = localStorage.getItem('visite3d_selection');

    if (!saved) {
      return null;
    }

    try {
      return JSON.parse(saved);
    } catch {
      return null;
    }
  }

  private getVisite3DModificationStorage(): any | null {
    const saved = localStorage.getItem('visite3d_modification');

    if (!saved) return null;

    try {
      return JSON.parse(saved);
    } catch {
      return null;
    }
  }
}
