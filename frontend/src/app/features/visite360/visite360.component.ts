import {
  Component,
  Input,
  OnDestroy,
  AfterViewInit,
  ElementRef,
  ViewChild,
  OnChanges,
  SimpleChanges
} from '@angular/core';
import { CommonModule } from '@angular/common';

export interface Scene360 {
  id: string;
  titre: string;
  imageUrl: string;       // URL de la photo panoramique (stockée en base)
  hotspots?: Hotspot360[];
}

export interface Hotspot360 {
  pitch: number;
  yaw: number;
  type: 'scene' | 'info';
  text: string;
  sceneId?: string;       // pour les hotspots de navigation
}

declare const pannellum: any;

@Component({
  selector: 'app-visite360',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './visite360.component.html',
  styleUrls: ['./visite360.component.scss']
})

export class Visite360Component implements AfterViewInit, OnDestroy, OnChanges {
  private lastSceneKey = '';
  @Input() scenes: Scene360[] = [];
  @Input() titrePropriete = '';

  @ViewChild('panoramaContainer') container!: ElementRef<HTMLDivElement>;
  sceneActive: Scene360 | null = null;
  viewer: any = null;
  pannellumCharge = false;

  ngAfterViewInit(): void {
    this.chargerPannellum().then(() => {
      this.rechargerSceneSiNecessaire();
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!changes['scenes']) return;
    if (!this.pannellumCharge) return;

    setTimeout(() => {
      this.rechargerSceneSiNecessaire();
    }, 0);
  }

  ngOnDestroy(): void {
    this.detruireViewer();
  }

  // ─── Charge Pannellum depuis CDN ──────────────────────────
  private chargerPannellum(): Promise<void> {
    return new Promise((resolve) => {
      if (typeof pannellum !== 'undefined') {
        this.pannellumCharge = true;
        resolve();
        return;
      }

      // CSS
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://cdn.jsdelivr.net/npm/pannellum@2.5.6/build/pannellum.css';
      document.head.appendChild(link);

      // JS
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/pannellum@2.5.6/build/pannellum.js';
      script.onload = () => {
        this.pannellumCharge = true;
        resolve();
      };
      document.head.appendChild(script);
    });
  }

  // ─── Charge une scène dans le viewer ─────────────────────
  chargerScene(scene: Scene360): void {
    this.sceneActive = scene;
    this.detruireViewer();

    if (!this.container?.nativeElement) return;

    const hotspots = (scene.hotspots || []).map(h => ({
      pitch: h.pitch,
      yaw: h.yaw,
      type: h.type === 'info' ? 'info' : 'custom',
      text: h.text,
      cssClass: h.type === 'scene' ? 'hotspot-nav' : 'hotspot-info',
      clickHandlerFunc: h.type === 'scene' && h.sceneId
        ? () => {
          const target = this.scenes.find(s => s.id === h.sceneId);
          if (target) this.chargerScene(target);
        }
        : undefined
    }));
    this.viewer = pannellum.viewer(this.container.nativeElement, {
      type: 'equirectangular',
      panorama: scene.imageUrl,
      autoLoad: true,
      hfov: 100,
      minHfov: 40,
      maxHfov: 130,

      // important pour les panoramas téléphone / images très larges
      vOffset: 0,


      pitch: 0,
      yaw: 0,

      maxCanvasWidth: 2048,

      autoRotate: false,
      compass: false,
      showFullscreenCtrl: true,
      showZoomCtrl: true,
      mouseZoom: true,

      hotSpots: hotspots,

      strings: {
        loadButtonLabel: 'Cliquez pour démarrer la visite',
        loadingLabel: 'Chargement…',
        bylineLabel: '',
        noPanoramaError: 'Panorama non disponible.',
        fileAccessError: 'Impossible de charger le panorama.',
        fileAccessErrorMsg: 'Vérifiez l’URL de la photo.',
        aboutMsg: ''
      }
    });
  }

  private detruireViewer(): void {
    if (this.viewer) {
      try {
        this.viewer.destroy();
      } catch {}
      this.viewer = null;
    }

    if (this.container?.nativeElement) {
      this.container.nativeElement.innerHTML = '';
    }
  }

  private rechargerSceneSiNecessaire(): void {
    if (!this.scenes || this.scenes.length === 0) {
      this.detruireViewer();
      this.sceneActive = null;
      this.lastSceneKey = '';
      return;
    }

    const scene = this.scenes[0];
    const key = `${scene.id}|${scene.imageUrl}`;

    if (key === this.lastSceneKey) {
      return;
    }

    this.lastSceneKey = key;
    this.chargerScene(scene);
  }
}
