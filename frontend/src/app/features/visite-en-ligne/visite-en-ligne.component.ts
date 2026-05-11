import { CommonModule } from '@angular/common';
import {
  Component,
  OnInit,
  AfterViewInit,
  OnDestroy,
  ElementRef,
  ViewChild,
  inject,
  signal,
  ChangeDetectorRef
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { VisiteDTO, VisiteService } from '../../core/services/visite.service';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { VideoUploadService } from '../../core/services/video-upload.service';
import { Visite360Component } from '../visite360/visite360.component';
import { Visite3dService } from '../../core/services/visite3d.service';
declare global {
  interface Window {
    JitsiMeetExternalAPI: any;
  }
}

type OngletVisite = 'directes' | 'preenregistrees' | 'visite3d';
type VueVisite = 'dashboard' | 'planification';

@Component({
  selector: 'app-visite-en-ligne',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, Visite360Component],
  templateUrl: './visite-en-ligne.component.html',
  styleUrls: ['./visite-en-ligne.component.scss']
})
export class VisiteEnLigneComponent implements OnInit, AfterViewInit, OnDestroy {
  private readonly visite3dService = inject(Visite3dService);

  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private visiteService = inject(VisiteService);
  private authService = inject(AuthService);
  private cdr = inject(ChangeDetectorRef);
  private videoUploadService = inject(VideoUploadService);
  private readonly BASE_URL = 'http://192.168.1.175:30808';

  @ViewChild('jitsiContainer') jitsiContainer?: ElementRef<HTMLDivElement>;

  ongletActif = signal<OngletVisite>('directes');
  vueActuelle: VueVisite = 'dashboard';

  proprietaireId = 0;
  loading = false;
  saving = false;
  erreur = '';
  jitsiActif      = false;


  visites: VisiteDTO[] = [];
  visitesDirectes: VisiteDTO[] = [];
  videosPreenregistrees: VisiteDTO[] = [];
  visites3D: VisiteDTO[] = [];
  visitesEtudiant3D: VisiteDTO[] = [];

  filtreEtudiant = '';

  visiteSelectionnee?: VisiteDTO;
  detailVisible = false;

  filtreDate = '';
  filtreNom = '';
  filtreStatut = '';

  statutsDisponibles: string[] = [
    'NON_TRAITEE',
    'VISITE_PROPOSEE',
    'LIEN_ENVOYE',
    'VIDEO_ENVOYEE',
    'CONFIRMEE',
    'TERMINEE',
    'ANNULEE',
    'REFUSEE'
  ];

  meetingCode = '';
  meetSpaceName = '';

  demandeId = 0;
  annonceId = 0;
  etudiantId = 0;
  idVisite?: number;

  nomEtudiant = '';
  titreAnnonce = '';
  adresseAnnonce = '';
  typeVisite = '';
  formatVisite = '';
  momentVisite = '';
  etudiantConnecteId = 0;
  visitesEtudiant: VisiteDTO[] = [];
  visitesEtudiantDirectes: VisiteDTO[] = [];
  videosEtudiantPreenregistrees: VisiteDTO[] = [];
  mode: 'direct' | 'video' | 'visite3d' = 'direct';

  dateVisite = '';
  heureDebut = '';
  heureFin = '';
  lienVisio = '';
  videoUrl = '';
  message = '';
  etudiantEmail = '';
  etudiantTelephone = '';

  selectedVisioService: 'google' | 'jitsi' = 'google';
  jitsiUri = '';
  jitsiRoomName = '';


  roleActuel: 'PROPRIETAIRE' | 'ETUDIANT' | 'PRESTATAIRE' | '' = '';
  selectedVideoFile: File | null = null;
  private jitsiApi: any = null;

  statutsEtudiant = ['PLANIFIEE', 'TERMINEE', 'ANNULEE'];
  filtreStatutEtudiant = '';
  scenes3DEtudiant: any[] = [];
  visite3DOuverte = false;

  modalEnvoi3DOuvert = false;
  annonceSelectionnee3D: any = null;
  etudiantsPourEnvoi3D: any[] = [];

  visites3DPubliees = new Set<number>();

  ngOnInit(): void {
    const utilisateur = this.authService.getSnapshot();
    const role = utilisateur?.role;

    if (role === 'PROPRIETAIRE' || role === 'ETUDIANT') {
      this.roleActuel = role;
    } else {
      this.roleActuel = '';
    }

    if (!utilisateur?.id) {
      this.erreur = 'Utilisateur non identifié';
      return;
    }

    if (this.roleActuel === 'ETUDIANT') {
      this.etudiantConnecteId = utilisateur.id;
      this.vueActuelle = 'dashboard';
      this.ongletActif.set('directes');
      this.chargerVisitesEtudiant(this.etudiantConnecteId);
      return;
    }

    this.proprietaireId = utilisateur.id;
    this.route.queryParams.subscribe(params => {
      const action = params['action'] || '';
      const visiteId = Number(params['visiteId'] || 0);

      if (action === 'planifier' && visiteId) {
        this.vueActuelle = 'planification';
        this.chargerVisite(visiteId);
      } else {
        this.vueActuelle = 'dashboard';
        this.ongletActif.set('directes');
        this.chargerVisitesProprietaire(this.proprietaireId);
      }
    });
  }

  ngAfterViewInit(): void {
    if (
      this.vueActuelle === 'planification' &&
      this.mode === 'direct' &&
      this.selectedVisioService === 'jitsi'
    ) {
      setTimeout(() => this.initJitsi(), 150);
    }
  }

  ngOnDestroy(): void {
    this.destroyJitsi();
  }

  choisirOnglet(onglet: OngletVisite): void {
    this.ongletActif.set(onglet);
    this.visiteSelectionnee = undefined;
    this.detailVisible = false;

    if (onglet === 'visite3d' && this.roleActuel === 'PROPRIETAIRE') {
      this.verifierVisites3DPubliees();
    }
  }

  toggleDetail(visite: VisiteDTO): void {
    if (this.visiteSelectionnee?.idVisite === visite.idVisite && this.detailVisible) {
      this.detailVisible = false;
      return;
    }

    this.visiteSelectionnee = visite;
    this.detailVisible = true;
  }

  fermerDetail(): void {
    this.detailVisible = false;
  }

  choisirMode(mode: 'direct' | 'video' | 'visite3d'): void {    this.mode = mode;

    if (mode !== 'direct') {
      this.destroyJitsi();
      this.selectedVisioService = 'google';
      this.jitsiUri = '';
      this.jitsiRoomName = '';
    }
    if (mode === 'video') {
      this.updateVideoPreview();
    } else {
      this.safeEmbedUrl = null;
    }
  }

  retourDashboard(): void {
    this.destroyJitsi();
    this.vueActuelle = 'dashboard';
    this.visiteSelectionnee = undefined;
    this.detailVisible = false;
    this.router.navigate(['/visite-en-ligne']);
    this.chargerVisitesProprietaire(this.proprietaireId);
  }

  chargerVisitesProprietaire(proprietaireId: number): void {
    this.loading = true;
    this.erreur = '';

    this.visiteService.getByProprietaire(proprietaireId).subscribe({
      next: (data: VisiteDTO[]) => {
        const visites = Array.isArray(data) ? data : [];
        this.visites = visites;

        this.visitesDirectes = visites.filter(v => v.modeVisite === 'DIRECT');
        this.videosPreenregistrees = visites.filter(v => v.modeVisite === 'VIDEO');
        this.visites3D = this.garderUneVisiteParAnnonce(visites);
        this.verifierVisites3DPubliees();
        this.visiteSelectionnee = undefined;
        this.detailVisible = false;

        this.loading = false;
      },
      error: (err: any) => {
        console.error('Erreur chargement visites', err);
        this.erreur = 'Erreur lors du chargement des visites';
        this.loading = false;
      }
    });
  }

  chargerVisite(visiteId: number): void {
    this.loading = true;
    this.erreur = '';
    this.destroyJitsi();

    this.visiteService.getById(visiteId).subscribe({
      next: (visite: VisiteDTO) => {
        const v = visite as any;

        this.visiteSelectionnee = visite;
        this.idVisite = visite.idVisite ?? undefined;
        this.demandeId = visite.demandeId ?? 0;
        this.annonceId = visite.annonceId ?? 0;
        this.etudiantId = visite.etudiantId ?? 0;

        if (visite.modeVisite === 'VIDEO') {
          this.mode = 'video';
        } else if (visite.modeVisite === 'VISITE_3D') {
          this.mode = 'visite3d';
        } else {
          this.mode = 'direct';
        }       ;
        this.dateVisite = visite.dateVisite ? String(visite.dateVisite) : '';
        this.heureDebut = visite.heureDebut ? String(visite.heureDebut) : '';
        this.heureFin = visite.heureFin ? String(visite.heureFin) : '';
        this.lienVisio = visite.meetUri ?? '';
        this.videoUrl = visite.videoUrl ?? '';
        this.updateVideoPreview();
        this.message = visite.message ?? '';
        this.meetingCode = visite.meetingCode ?? '';
        this.meetSpaceName = visite.meetSpaceName ?? '';

        this.jitsiUri = visite.jitsiUri ?? '';
        this.jitsiRoomName = visite.jitsiRoomName ?? '';

        this.etudiantEmail = v.etudiantEmail ?? '';
        this.etudiantTelephone = v.etudiantTelephone ?? '';

        if (this.mode === 'video') {
          this.selectedVisioService = 'google';
          this.jitsiUri = '';
          this.jitsiRoomName = '';
        } else if (this.jitsiUri || this.jitsiRoomName) {
          this.selectedVisioService = 'jitsi';
        } else {
          this.selectedVisioService = 'google';
        }

        this.nomEtudiant = v.nomEtudiant || `Étudiant #${this.etudiantId || '—'}`;
        this.titreAnnonce = v.titreAnnonce || `Annonce #${this.annonceId || '—'}`;
        this.typeVisite = v.typeVisite || 'EN_LIGNE';
        this.formatVisite =
          v.formatVisite ||
          (this.mode === 'direct'
            ? 'DIRECT'
            : this.mode === 'video'
              ? 'VIDEO'
              : 'VISITE_3D');        this.momentVisite = v.momentVisite || '';

        this.loading = false;

        this.cdr.detectChanges();

        if (this.mode === 'direct' && this.selectedVisioService === 'jitsi') {
          setTimeout(() => this.initJitsi(), 150);
        } else {
          this.destroyJitsi();
        }
      },
      error: err => {
        console.error('Impossible de charger la visite', err);
        this.erreur = 'Impossible de charger la visite';
        this.loading = false;
      }
    });
  }

  enregistrerEtEnvoyer(): void {
    if (!this.visiteSelectionnee?.idVisite) {
      alert('Visite introuvable');
      return;
    }

    const payload: VisiteDTO = {
      idVisite: this.visiteSelectionnee.idVisite,
      demandeId: this.demandeId,
      annonceId: this.annonceId,
      etudiantId: this.etudiantId,
      proprietaireId: this.visiteSelectionnee.proprietaireId ?? this.proprietaireId,
      modeVisite:
        this.mode === 'direct'
          ? 'DIRECT'
          : this.mode === 'video'
            ? 'VIDEO'
            : 'VISITE_3D',
      statutVisite:
        this.mode === 'direct'
          ? 'VISITE_PROPOSEE'
          : this.mode === 'video'
            ? 'VIDEO_ENVOYEE'
            : 'VISITE_PROPOSEE',
      dateVisite: this.mode === 'direct' ? (this.dateVisite || null) : null,
      heureDebut: this.mode === 'direct' ? (this.heureDebut || null) : null,
      heureFin: this.mode === 'direct' ? (this.heureFin || null) : null,

      meetUri:
        this.mode === 'direct' && this.selectedVisioService === 'google'
          ? (this.lienVisio || null)
          : null,

      jitsiUri:
        this.mode === 'direct' && this.selectedVisioService === 'jitsi'
          ? (this.jitsiUri || null)
          : null,

      jitsiRoomName:
        this.mode === 'direct' && this.selectedVisioService === 'jitsi'
          ? (this.jitsiRoomName || null)
          : null,

      videoUrl: this.mode === 'video' ? (this.videoUrl || null) : null,
      message: this.message || null
    };

    this.saving = true;

    this.visiteService.creerOuMettreAJour(payload).subscribe({
      next: (saved: VisiteDTO) => {
        this.saving = false;
        this.visiteSelectionnee = saved;
        this.idVisite = saved.idVisite ?? undefined;
        this.lienVisio = saved.meetUri ?? '';
        this.videoUrl = saved.videoUrl ?? '';
        this.updateVideoPreview();
        this.meetingCode = saved.meetingCode ?? '';
        this.meetSpaceName = saved.meetSpaceName ?? '';
        this.jitsiUri = saved.jitsiUri ?? this.jitsiUri;
        this.jitsiRoomName = saved.jitsiRoomName ?? this.jitsiRoomName;

        this.cdr.detectChanges();

        if (this.mode === 'direct' && this.selectedVisioService === 'jitsi') {
          setTimeout(() => this.initJitsi(), 150);
        } else {
          this.destroyJitsi();
        }

        alert(this.mode === 'direct' ? 'Invitation envoyée.' : 'Vidéo envoyée.');
        this.router.navigate(['/visite-en-ligne']);
        this.chargerVisitesProprietaire(this.proprietaireId);
      },
      error: err => {
        console.error('Erreur lors de la sauvegarde', err);
        this.saving = false;
        alert('Erreur lors de la sauvegarde');
      }
    });
  }

  get visitesFiltrees(): VisiteDTO[] {
    let source: VisiteDTO[] = [];

    if (this.ongletActif() === 'directes') {
      source = this.visitesDirectes;
    } else if (this.ongletActif() === 'preenregistrees') {
      source = this.videosPreenregistrees;
    } else {
      source = this.visites3D;
    }

    return source.filter((v: any) => {
      const okDate =
        !this.filtreDate || String(v.dateVisite || '').startsWith(this.filtreDate);

      const okNom =
        !this.filtreNom ||
        this.getNomEtudiant(v).toLowerCase().includes(this.filtreNom.toLowerCase().trim()) ||
        this.getTitreAnnonce(v).toLowerCase().includes(this.filtreNom.toLowerCase().trim());

      const okStatut =
        this.ongletActif() === 'visite3d'
          ? true
          : !this.filtreStatut || (v.statutVisite || '') === this.filtreStatut;

      return okDate && okNom && okStatut;
    });
  }
  getNomEtudiant(visite: any): string {
    return (
      visite?.nomEtudiant ||
      visite?.etudiantNom ||
      visite?.etudiantNomComplet ||
      visite?.etudiant?.nomComplet ||
      visite?.etudiant?.nom ||
      `Étudiant #${visite?.etudiantId ?? ''}`
    );
  }

  getTitreAnnonce(visite: any): string {
    return (
      visite?.titreAnnonce ||
      visite?.annonceTitre ||
      visite?.annonce?.titre ||
      `Annonce #${visite?.annonceId ?? ''}`
    );
  }

  ouvrirMeet(lien?: string): void {
    const url = lien || this.lienVisio || this.jitsiUri;
    if (!url) return;
    window.open(url, '_blank');
  }

  getVisiteLabel(typeVisite?: string, formatVisite?: string): string {
    const type = (typeVisite || this.typeVisite || '').toLowerCase();
    const format = (formatVisite || this.formatVisite || '').toLowerCase();

    if (type.includes('ligne') && format.includes('direct')) return 'En ligne · direct';
    if (type.includes('ligne') && format.includes('video')) return 'En ligne · vidéo';
    if (type.includes('sur')) return 'Sur place';

    return 'Non précisé';
  }

  getStatutClass(statut?: string): string {
    switch (statut) {
      case 'NON_TRAITEE': return 'pill pill-warning';
      case 'VISITE_PROPOSEE':
      case 'LIEN_ENVOYE':
      case 'CONFIRMEE': return 'pill pill-success';
      case 'VIDEO_ENVOYEE': return 'pill pill-info';
      case 'TERMINEE': return 'pill pill-neutral';
      case 'ANNULEE':
      case 'REFUSEE': return 'pill pill-danger';
      default: return 'pill pill-neutral';
    }
  }

  getStatutLabel(statut?: string): string {
    switch (statut) {
      case 'NON_TRAITEE': return 'Non traitée';
      case 'VISITE_PROPOSEE': return 'Visite proposée';
      case 'LIEN_ENVOYE': return 'Lien envoyé';
      case 'VIDEO_ENVOYEE': return 'Vidéo envoyée';
      case 'CONFIRMEE': return 'Confirmée';
      case 'TERMINEE': return 'Terminée';
      case 'ANNULEE': return 'Annulée';
      case 'REFUSEE': return 'Refusée';
      default: return 'Non traitée';
    }
  }

  getInitiales(nom: string): string {
    if (!nom) return '?';
    return nom
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }

  switchVisioService(service: 'google' | 'jitsi'): void {
    if (this.mode !== 'direct') return;

    this.selectedVisioService = service;
    this.cdr.detectChanges();

    if (service === 'jitsi') {
      setTimeout(() => this.initJitsi(), 150);
    } else {
      this.destroyJitsi();
    }
  }

  private initJitsi(): void {
    if (this.mode !== 'direct') return;

    if (!window.JitsiMeetExternalAPI) {
      console.error(
        '[Jitsi] window.JitsiMeetExternalAPI est undefined. ' +
        'Assurez-vous d’avoir ajouté dans index.html : ' +
        '<script src="https://meet.jit.si/external_api.js"></script>'
      );
      return;
    }

    if (!this.jitsiContainer?.nativeElement) {
      console.error('[Jitsi] Le conteneur #jitsiContainer est introuvable dans le DOM.');
      return;
    }

    this.destroyJitsi();

    if (!this.jitsiRoomName || this.jitsiRoomName.trim() === '') {
      this.jitsiRoomName = `locavia-visite-${this.idVisite ?? Date.now()}`;
    }

    this.jitsiUri = `https://meet.jit.si/${this.jitsiRoomName}`;

    try {
      this.jitsiApi = new window.JitsiMeetExternalAPI('meet.jit.si', {
        roomName: this.jitsiRoomName,
        parentNode: this.jitsiContainer.nativeElement,
        width: '100%',
        height: '100%',
        userInfo: {
          displayName: 'Propriétaire'
        },
        configOverwrite: {
          prejoinPageEnabled: false,
          startWithAudioMuted: true,
          startWithVideoMuted: true,
          disableDeepLinking: true
        },
        interfaceConfigOverwrite: {
          MOBILE_APP_PROMO: false,
          SHOW_JITSI_WATERMARK: false,
          SHOW_WATERMARK_FOR_GUESTS: false
        }
      });

      console.log('[Jitsi] Réunion initialisée :', this.jitsiRoomName);
    } catch (err) {
      console.error('[Jitsi] Erreur lors de l\'initialisation :', err);
    }
  }

  private destroyJitsi(): void {
    if (this.jitsiApi) {
      try {
        this.jitsiApi.dispose();
      } catch {
      }
      this.jitsiApi = null;
    }
  }



constructor(private sanitizer: DomSanitizer) {

}
  safeEmbedUrl: SafeResourceUrl | null = null;

  onVideoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] || null;

    this.selectedVideoFile = file;
  }

  uploaderVideo(): void {
    if (!this.selectedVideoFile) {
      return;
    }

    this.videoUploadService.upload(this.selectedVideoFile).subscribe({
      next: (res) => {
        this.videoUrl = res.url.startsWith('http')
          ? res.url
          : `http://192.168.1.175:30808${res.url}`;

        this.updateVideoPreview();
        console.log('Vidéo uploadée :', this.videoUrl);
      },
      error: (err) => {
        console.error('Erreur upload vidéo', err);
      }
    });
  }


  getFullVideoUrl(): string | null {
    if (!this.videoUrl) return null;

    if (this.videoUrl.startsWith('http://') || this.videoUrl.startsWith('https://')) {
      return this.videoUrl;
    }

    return this.BASE_URL + this.videoUrl;
  }


  private updateVideoPreview(): void {
    const fullUrl = this.getFullVideoUrl();

    if (!fullUrl) {
      this.safeEmbedUrl = null;
      return;
    }

    if (this.isDirectVideoLink(fullUrl)) {
      this.safeEmbedUrl = null;
      return;
    }

    let embedUrl: string | null = null;

    // YouTube
    if (fullUrl.includes('youtube.com/watch?v=')) {
      const id = fullUrl.split('v=')[1]?.split('&')[0];
      if (id) embedUrl = `https://www.youtube.com/embed/${id}`;
    } else if (fullUrl.includes('youtu.be/')) {
      const id = fullUrl.split('youtu.be/')[1]?.split('?')[0];
      if (id) embedUrl = `https://www.youtube.com/embed/${id}`;
    }

    // Google Drive
    else if (fullUrl.includes('drive.google.com/file/d/')) {
      const fileId = fullUrl.split('/d/')[1]?.split('/')[0];
      if (fileId) embedUrl = `https://drive.google.com/file/d/${fileId}/preview`;
    }

    // Vimeo
    else if (fullUrl.includes('vimeo.com/')) {
      const id = fullUrl.split('vimeo.com/')[1]?.split('?')[0];
      if (id) embedUrl = `https://player.vimeo.com/video/${id}`;
    }

    this.safeEmbedUrl = embedUrl
      ? this.sanitizer.bypassSecurityTrustResourceUrl(embedUrl)
      : null;
  }



  isDirectVideoLink(url?: string | null): boolean {
    if (!url) return false;
    const lower = url.toLowerCase();

    return (
      lower.includes('/api/videos/') ||
      lower.endsWith('.mp4') ||
      lower.endsWith('.webm') ||
      lower.endsWith('.ogg') ||
      lower.endsWith('.m4v')
    );
  }

  getVideoMime(): string {
    const url = this.getFullVideoUrl() || '';
    const lower = url.toLowerCase();

    if (lower.endsWith('.webm')) return 'video/webm';
    if (lower.endsWith('.ogg')) return 'video/ogg';
    if (lower.endsWith('.mov')) return 'video/quicktime';
    if (lower.endsWith('.avi')) return 'video/x-msvideo';
    if (lower.endsWith('.mkv')) return 'video/x-matroska';

    return 'video/mp4';
  }

  canOpenExternally(): boolean {
    return !!this.getFullVideoUrl() && !this.isDirectVideoLink(this.getFullVideoUrl()) && !this.safeEmbedUrl;
  }

  chargerVisitesEtudiant(etudiantId: number): void {
    this.loading = true;
    this.erreur = '';

    this.visiteService.getByEtudiant(etudiantId).subscribe({
      next: (data: VisiteDTO[]) => {
        const visites = Array.isArray(data) ? data : [];
        this.visitesEtudiant = visites;
        this.visitesEtudiantDirectes = visites.filter(v => v.modeVisite === 'DIRECT');
        this.videosEtudiantPreenregistrees = visites.filter(v => v.modeVisite === 'VIDEO');
        const visites3DBase = this.garderUneVisiteParDemande(visites);

        this.visite3dService.getDemandesPartageesEtudiant(etudiantId).subscribe({
          next: (demandeIds: number[]) => {
            const ids = new Set(demandeIds.map(id => Number(id)));

            this.visitesEtudiant3D = visites3DBase.filter((v: any) =>
              ids.has(Number(v.demandeId))
            );

            this.loading = false;
          },
          error: (err) => {
            console.error('Erreur chargement partages 3D', err);
            this.visitesEtudiant3D = [];
            this.loading = false;
          }
        });
      },
      error: err => {
        console.error('Erreur chargement visites étudiant', err);
        this.erreur = 'Erreur lors du chargement des visites';
        this.loading = false;
      }
    });
  }


  getNomProprietaire(visite: any): string {
    return (
      visite?.nomProprietaire ||
      visite?.proprietaireNom ||
      visite?.proprietaireNomComplet ||
      visite?.proprietaire?.nomComplet ||
      visite?.proprietaire?.nom ||
      visite?.proprietaireEmail ||
      visite?.proprietaire?.email ||
      `Propriétaire #${visite?.proprietaireId ?? ''}`
    );
  }

  getEmailProprietaire(visite: any): string {
    return (
      visite?.proprietaireEmail ||
      visite?.proprietaire?.email ||
      '—'
    );
  }

  getPhotoAnnonce(visite: any): string {
    return (
      visite?.photoAnnonce ||
      visite?.annoncePhoto ||
      visite?.annonce?.photoPrincipale ||
      visite?.annonce?.photoUrl ||
      'assets/images/logement-placeholder.png'
    );
  }

  setDefaultPhoto(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.src = 'assets/images/logement-placeholder.png';
  }
  getAbsoluteVideoUrl(url?: string | null): string | null {
    if (!url) return null;

    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }

    return this.BASE_URL + url;
  }

  ouvrirVisiteEtudiant(item: any): void {
    if (!item?.idVisite) return;

    this.vueActuelle = 'planification';
    this.chargerVisite(item.idVisite);
  }

  contacterProprietaire(): void {
    const proprietaireId =
      (this.visiteSelectionnee as any)?.proprietaireId || 0;

    if (!proprietaireId) return;

    this.router.navigate(['/messagerie'], {
      queryParams: {
        userId: proprietaireId,
        annonceId: this.annonceId || null
      }
    });
  }



  ouvrirContenuEtudiant(item: any): void {
    if (item.modeVisite === 'VIDEO' && item.videoUrl) {
      const videoUrl = this.getAbsoluteVideoUrl(item.videoUrl);
      if (videoUrl) {
        window.open(videoUrl, '_blank');
      }
      return;
    }

    if (item.modeVisite === 'DIRECT') {
      const lien = item.jitsiUri || item.meetUri;
      const fullLien = this.getAbsoluteVideoUrl(lien);
      if (fullLien) {
        window.open(fullLien, '_blank');
      }
    }
  }

  voirDetailEtudiant(item: any): void {
    if (!item?.idVisite) return;

    this.vueActuelle = 'planification';
    this.chargerVisite(item.idVisite);
  }

  getStatutEtudiantLabel(statut?: string): string {
    switch (statut) {
      case 'TERMINEE':
        return 'Terminée';

      case 'ANNULEE':
      case 'REFUSEE':
        return 'Annulée';

      default:
        return 'Planifiée';
    }
  }

  getStatutEtudiantClass(statut?: string): string {
    switch (statut) {
      case 'TERMINEE':
        return 'pill pill-neutral';

      case 'ANNULEE':
      case 'REFUSEE':
        return 'pill pill-danger';

      default:
        return 'pill pill-success';
    }
  }

  get visitesFiltreesEtudiant(): VisiteDTO[] {
    let source: VisiteDTO[] = [];

    if (this.ongletActif() === 'directes') {
      source = this.visitesEtudiantDirectes;
    } else if (this.ongletActif() === 'preenregistrees') {
      source = this.videosEtudiantPreenregistrees;
    } else {
      source = this.visitesEtudiant3D;
    }

    return source.filter((v: any) => {
      const okDate =
        !this.filtreDate || String(v.dateVisite || '') === this.filtreDate;

      const okAppartement =
        !this.filtreNom ||
        this.getTitreAnnonce(v).toLowerCase().includes(this.filtreNom.toLowerCase().trim());

      const okEtudiant =
        !this.filtreEtudiant ||
        this.getNomEtudiant(v).toLowerCase().includes(this.filtreEtudiant.toLowerCase().trim());

      return okDate && okAppartement && okEtudiant;
    });
  }
  ouvrirVisite3D(item: any): void {
    if (!item?.idVisite) return;

    this.vueActuelle = 'planification';
    this.chargerVisite(item.idVisite);
  }

  scenes360 = [
    {
      id: 'salon',
      titre: 'Salon',
      imageUrl: 'assets/visites360/salon.jpg',
      hotspots: [
        {
          pitch: 0,
          yaw: 90,
          type: 'scene' as const,
          text: 'Aller à la chambre',
          sceneId: 'chambre'
        }
      ]
    },
    {
      id: 'chambre',
      titre: 'Chambre',
      imageUrl: 'assets/visites360/chambre.jpg',
      hotspots: [
        {
          pitch: 0,
          yaw: 180,
          type: 'scene' as const,
          text: 'Retour au salon',
          sceneId: 'salon'
        }
      ]
    }
  ];

  private garderUneVisiteParDemande(visites: VisiteDTO[]): VisiteDTO[] {
    const map = new Map<number, VisiteDTO>();

    visites.forEach(v => {
      const demandeId = v.demandeId ?? 0;

      if (!demandeId) return;

      if (!map.has(demandeId)) {
        map.set(demandeId, v);
      }
    });

    return Array.from(map.values());
  }



  ouvrirCreation3D(item: any): void {
    const annonceId = this.getAnnonceId(item);

    if (!annonceId) {
      alert('Annonce introuvable.');
      console.error('ITEM SANS annonceId = ', item);
      return;
    }

    const visite3D = {
      annonceId: annonceId,
      demandeId: item.demandeId,
      idVisite: item.idVisite,

      titreAnnonce: this.getTitreAnnonce(item),
      nomEtudiant: this.getNomEtudiant(item),
      etudiantEmail: item.etudiantEmail || '',

      dateVisite: item.dateVisite || item.createdAt || '',
      photoAnnonce: this.getPhotoAnnonce(item)
    };

    localStorage.setItem('visite3d_selection', JSON.stringify(visite3D));
    localStorage.removeItem('visite3d_modification');

    this.router.navigate(['/create-visite-3d'], {
      state: {
        mode: 'CREATION',
        visite: visite3D
      }
    });
  }


  ouvrirVisite3DEtudiant(item: any): void {
    if (!item.demandeId) {
      alert('Demande introuvable.');
      return;
    }

    this.visite3dService.getByDemandePartagee(item.demandeId).subscribe({
      next: (data) => {
        this.scenes3DEtudiant = this.transformerVisite3D(data);
        this.visite3DOuverte = true;

        setTimeout(() => {
          const bloc = document.querySelector('.student-3d-viewer');
          bloc?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
      },
      error: () => {
        alert('Cette visite 3D ne vous a pas encore été envoyée.');
      }
    });
  }

  private transformerVisite3D(data: any): any[] {
    const scenes = data.scenes || [];
    const liens = data.liens || [];

    return scenes.map((scene: any) => {
      const sceneId = String(scene.tempId);

      const hotspots = liens
        .filter((lien: any) => String(lien.sourceId) === sceneId)
        .map((lien: any) => ({
          pitch: lien.pitch,
          yaw: lien.yaw,
          type: 'scene',
          text: lien.texte || 'Aller à la pièce',
          sceneId: String(lien.targetId)
        }));

      return {
        id: sceneId,
        titre: scene.titre,
        imageUrl: this.visite3dService.toFullImageUrl(scene.imageUrl),
        hotspots
      };
    });
  }


  ouvrirModalEnvoi3D(item: any): void {
    const annonceId = this.getAnnonceId(item);

    if (!annonceId) {
      alert('Annonce introuvable.');
      return;
    }

    this.annonceSelectionnee3D = item;

    const visitesMemeAnnonce = (this.visites || []).filter((v: any) => {
      return this.getAnnonceId(v) === annonceId;
    });

    const map = new Map<number, any>();

    visitesMemeAnnonce.forEach((v: any) => {
      if (!v.demandeId) return;

      if (!map.has(v.demandeId)) {
        map.set(v.demandeId, {
          selectionne: false,
          demandeId: v.demandeId,
          etudiantId: v.etudiantId,
          nomEtudiant: this.getNomEtudiant(v),
          emailEtudiant: v.etudiantEmail || v.emailEtudiant || '—',
          dateDemande: v.dateVisite || v.createdAt || '—'
        });
      }
    });

    this.etudiantsPourEnvoi3D = Array.from(map.values());
    this.modalEnvoi3DOuvert = true;
  }

  fermerModalEnvoi3D(): void {
    this.modalEnvoi3DOuvert = false;
    this.annonceSelectionnee3D = null;
    this.etudiantsPourEnvoi3D = [];
  }

  getNombreSelectionnes3D(): number {
    return this.etudiantsPourEnvoi3D.filter(e => e.selectionne).length;
  }


  envoyerVisite3D(): void {
    const selectionnes = this.etudiantsPourEnvoi3D.filter(e => e.selectionne);

    if (selectionnes.length === 0) {
      alert('Sélectionnez au moins un étudiant.');
      return;
    }

    const annonceId = this.getAnnonceId(this.annonceSelectionnee3D);

    if (!annonceId) {
      alert('Annonce introuvable.');
      return;
    }

    const payload = {
      annonceId: annonceId,
      destinataires: selectionnes.map(e => ({
        demandeId: e.demandeId,
        etudiantId: e.etudiantId
      }))
    };

    this.visite3dService.envoyerVisite3D(payload).subscribe({
      next: () => {
        alert('Visite 3D envoyée aux étudiants sélectionnés.');
        this.fermerModalEnvoi3D();
      },
      error: (err) => {
        console.error(err);
        alert('Erreur lors de l’envoi de la visite 3D.');
      }
    });
  }









  private garderUneVisiteParAnnonce(visites: any[]): any[] {
    const map = new Map<number, any>();

    visites.forEach(v => {
      const annonceId = this.getAnnonceId(v);

      if (!annonceId) return;

      if (!map.has(annonceId)) {
        map.set(annonceId, v);
      }
    });

    return Array.from(map.values());
  }

  hasVisite3D(item: any): boolean {
    return item?.visite3DDisponible === true;
  }

  verifierVisites3DPubliees(): void {
    console.log('LISTE VISITES 3D AVANT VERIFICATION = ', this.visites3D);

    this.visites3D.forEach((item: any) => {
      const annonceId = this.getAnnonceId(item);

      console.log('VERIFICATION 3D POUR annonceId = ', annonceId, item);

      if (!annonceId) {
        item.visite3DDisponible = false;
        return;
      }

      this.visite3dService.getByAnnonce(annonceId).subscribe({
        next: (data) => {
          console.log('3D TROUVEE POUR ANNONCE = ', annonceId, data);

          item.visite3DDisponible = true;
          item.visite3DData = data;

          this.cdr.detectChanges();
        },

        error: (err) => {
          console.warn(
            'PAS DE 3D POUR ANNONCE = ',
            annonceId,
            'STATUS = ',
            err?.status,
            'BODY = ',
            err?.error
          );

          item.visite3DDisponible = false;
          this.cdr.detectChanges();
        }
      });
    });
  }



  ouvrirModification3D(item: any): void {
    const annonceId = this.getAnnonceId(item);

    if (!annonceId) {
      alert('Annonce introuvable.');
      return;
    }

    const visiteInfo = {
      annonceId: annonceId,
      demandeId: item.demandeId,
      idVisite: item.idVisite,

      titreAnnonce: this.getTitreAnnonce(item),
      nomEtudiant: this.getNomEtudiant(item),
      etudiantEmail: item.etudiantEmail || '',

      dateVisite: item.dateVisite || item.createdAt || '',
      photoAnnonce: this.getPhotoAnnonce(item)
    };

    this.visite3dService.getByAnnonce(annonceId).subscribe({
      next: (visite3DExistante) => {
        localStorage.setItem('visite3d_selection', JSON.stringify(visiteInfo));
        localStorage.setItem('visite3d_modification', JSON.stringify(visite3DExistante));

        this.router.navigate(['/create-visite-3d'], {
          state: {
            mode: 'MODIFICATION',
            visite: visiteInfo,
            visite3DExistante: visite3DExistante
          }
        });
      },
      error: () => {
        alert('Aucune visite 3D publiée pour cet appartement.');
      }
    });
  }
  getAnnonceId(item: any): number | null {
    const raw =
      item?.annonceId ??
      item?.idAnnonce ??
      item?.annonce?.idAnnonce ??
      item?.annonce?.id ??
      null;

    const id = Number(raw);

    return Number.isFinite(id) && id > 0 ? id : null;
  }

  fermerVisite3DEtudiant(): void {
    this.visite3DOuverte = false;
    this.scenes3DEtudiant = [];
  }




  modalModificationVisiteOuverte = false;
  savingModificationVisite = false;

  modeModificationVisite: 'direct' | 'video' = 'direct';
  sourceVideoModification: 'lien' | 'fichier' = 'lien';

  nomVideoModificationSelectionnee = '';
  videoModificationFile: File | null = null;

  erreurModificationVisite = '';
  erreurDateModification = '';
  erreurHeureDebutModification = '';
  erreurHeureFinModification = '';
  erreurVideoModification = '';
  minDateVisite: string = new Date().toISOString().split('T')[0];

  tailleMaxVideoMo = 100;

  formModificationVisite: any = {
    idVisite: null,
    demandeId: null,
    modeVisite: '',
    dateVisite: '',
    heureDebut: '',
    heureFin: '',
    lienVisio: '',
    jitsiUri: '',
    videoUrl: '',
    message: ''
  };
  ouvrirModalModificationVisite(): void {
    this.erreurModificationVisite = '';
    this.erreurDateModification = '';
    this.erreurHeureDebutModification = '';
    this.erreurHeureFinModification = '';
    this.erreurVideoModification = '';

    this.videoModificationFile = null;
    this.nomVideoModificationSelectionnee = '';

    this.modeModificationVisite = this.mode === 'video' ? 'video' : 'direct';

    const visiteAny: any = this.visiteSelectionnee || {};

    this.formModificationVisite = {
      idVisite: visiteAny.idVisite || null,
      demandeId: this.demandeId || visiteAny.demandeId || null,
      modeVisite: this.modeModificationVisite === 'direct' ? 'DIRECT' : 'VIDEO',

      dateVisite: this.dateVisite || visiteAny.dateVisite || '',
      heureDebut: this.heureDebut || visiteAny.heureDebut || '',
      heureFin: this.heureFin || visiteAny.heureFin || '',

      lienVisio: this.lienVisio || visiteAny.lienVisio || visiteAny.googleMeetUrl || '',
      jitsiUri: this.jitsiUri || visiteAny.jitsiUri || '',

      videoUrl:
        visiteAny.videoUrl ||
        visiteAny.urlVideo ||
        visiteAny.video ||
        this.getFullVideoUrl?.() ||
        '',

      message: this.message || visiteAny.message || ''
    };

    this.sourceVideoModification =
      this.formModificationVisite.videoUrl ? 'lien' : 'fichier';

    this.modalModificationVisiteOuverte = true;
  }
  fermerModalModificationVisite(): void {
    this.modalModificationVisiteOuverte = false;
    this.savingModificationVisite = false;

    this.erreurModificationVisite = '';
    this.erreurDateModification = '';
    this.erreurHeureDebutModification = '';
    this.erreurHeureFinModification = '';
    this.erreurVideoModification = '';

    this.videoModificationFile = null;
    this.nomVideoModificationSelectionnee = '';
  }
  onVideoModificationSelected(event: Event): void {
    this.erreurVideoModification = '';
    this.nomVideoModificationSelectionnee = '';
    this.videoModificationFile = null;

    const input = event.target as HTMLInputElement;

    if (!input.files || input.files.length === 0) {
      return;
    }

    const file = input.files[0];

    const tailleMo = file.size / 1024 / 1024;

    if (tailleMo > this.tailleMaxVideoMo) {
      this.erreurVideoModification = `La vidéo dépasse ${this.tailleMaxVideoMo} Mo.`;
      input.value = '';
      return;
    }

    if (!file.type.startsWith('video/')) {
      this.erreurVideoModification = 'Veuillez sélectionner un fichier vidéo valide.';
      input.value = '';
      return;
    }

    this.videoModificationFile = file;
    this.nomVideoModificationSelectionnee = file.name;
  }
  validerModificationVisite(): boolean {
    this.erreurDateModification = '';
    this.erreurHeureDebutModification = '';
    this.erreurHeureFinModification = '';
    this.erreurVideoModification = '';
    this.erreurModificationVisite = '';

    if (this.modeModificationVisite === 'direct') {
      if (!this.formModificationVisite.dateVisite) {
        this.erreurDateModification = 'La date est obligatoire.';
        return false;
      }

      if (!this.formModificationVisite.heureDebut) {
        this.erreurHeureDebutModification = 'L’heure de début est obligatoire.';
        return false;
      }

      if (!this.formModificationVisite.heureFin) {
        this.erreurHeureFinModification = 'L’heure de fin est obligatoire.';
        return false;
      }

      if (this.formModificationVisite.heureDebut >= this.formModificationVisite.heureFin) {
        this.erreurHeureFinModification = 'L’heure de fin doit être après l’heure de début.';
        return false;
      }
    }

    if (this.modeModificationVisite === 'video') {
      if (this.sourceVideoModification === 'lien') {
        if (!this.formModificationVisite.videoUrl || !this.formModificationVisite.videoUrl.trim()) {
          this.erreurVideoModification = 'Le lien vidéo est obligatoire.';
          return false;
        }
      }

      if (this.sourceVideoModification === 'fichier' && !this.videoModificationFile) {
        this.erreurVideoModification = 'Veuillez sélectionner une vidéo.';
        return false;
      }
    }

    return true;
  }

  enregistrerModificationVisite(): void {
    if (!this.validerModificationVisite()) {
      return;
    }

    this.erreurModificationVisite = '';
    this.savingModificationVisite = true;

    const idVisite =
      this.formModificationVisite.idVisite ||
      this.visiteSelectionnee?.idVisite;

    if (!idVisite) {
      this.savingModificationVisite = false;
      this.erreurModificationVisite = 'Impossible de trouver la visite à modifier.';
      return;
    }

    /**
     * CAS 1 : VIDEO PREENREGISTREE AVEC LIEN
     */
    if (this.modeModificationVisite === 'video' && this.sourceVideoModification === 'lien') {
      const payload: any = {
        idVisite: idVisite,
        demandeId: this.formModificationVisite.demandeId || this.demandeId,
        modeVisite: 'VIDEO',
        videoUrl: this.formModificationVisite.videoUrl,
        message: this.formModificationVisite.message,
        statutVisite: this.visiteSelectionnee?.statutVisite || 'PLANIFIEE'
      };

      this.visiteService.creerOuMettreAJour(payload).subscribe({
        next: (visiteModifiee: any) => {
          this.savingModificationVisite = false;

          this.visiteSelectionnee = {
            ...this.visiteSelectionnee,
            ...visiteModifiee,
            videoUrl: visiteModifiee.videoUrl || payload.videoUrl,
            message: visiteModifiee.message || payload.message
          };

          this.message = visiteModifiee.message || payload.message;

          // important pour rafraîchir l’affichage vidéo
          this.safeEmbedUrl = null;

          this.modalModificationVisiteOuverte = false;
          this.retourDashboard();
        },
        error: (err) => {
          console.error('Erreur modification vidéo lien :', err);
          this.savingModificationVisite = false;
          this.erreurModificationVisite =
            err?.error?.message ||
            err?.error ||
            'Impossible de modifier la vidéo.';
        }
      });

      return;
    }

    /**
     * CAS 2 : VIDEO PREENREGISTREE AVEC FICHIER
     */
    if (this.modeModificationVisite === 'video' && this.sourceVideoModification === 'fichier') {
      if (!this.videoModificationFile) {
        this.savingModificationVisite = false;
        this.erreurVideoModification = 'Veuillez sélectionner une vidéo.';
        return;
      }

      const formData = new FormData();

      formData.append('idVisite', String(idVisite));
      formData.append('demandeId', String(this.formModificationVisite.demandeId || this.demandeId));
      formData.append('modeVisite', 'VIDEO');
      formData.append('message', this.formModificationVisite.message || '');
      formData.append('file', this.videoModificationFile);

      this.visiteService.modifierVideoVisite(idVisite, formData).subscribe({
        next: (visiteModifiee: any) => {
          this.savingModificationVisite = false;

          this.visiteSelectionnee = {
            ...this.visiteSelectionnee,
            ...visiteModifiee
          };

          this.message = visiteModifiee.message || this.formModificationVisite.message;

          // important pour forcer le rechargement
          this.safeEmbedUrl = null;

          this.modalModificationVisiteOuverte = false;
          this.retourDashboard();
        },
        error: (err) => {
          console.error('Erreur modification vidéo fichier :', err);
          this.savingModificationVisite = false;
          this.erreurModificationVisite =
            err?.error?.message ||
            err?.error ||
            'Impossible de modifier la vidéo.';
        }
      });

      return;
    }

    /**
     * CAS 3 : VISITE DIRECTE
     */
    this.dateVisite = this.formModificationVisite.dateVisite;
    this.heureDebut = this.formModificationVisite.heureDebut;
    this.heureFin = this.formModificationVisite.heureFin;
    this.message = this.formModificationVisite.message;

    this.fermerModalModificationVisite();
    this.enregistrerEtEnvoyer();
  }
  }
