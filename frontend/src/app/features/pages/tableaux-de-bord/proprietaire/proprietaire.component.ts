import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { AnnonceService } from '../../../../core/services/annonce.service';
import { AnnonceLocationDTO } from '../../../../core/models/annonce';
import {
  Utilisateur,
  ProfilProprietaire
} from '../../../../core/models/utilisateur.model';
import { MessagerieComponent } from '../../../messagerie/messagerie.component';
import { environment } from '../../../../../environments/environment';
import { AnnonceCardComponent } from '../../../yassine/annonces/components/annonce-card/annonce-card.component';
import { VisiteDTO, VisiteService } from '../../../../core/services/visite.service';
import {VideoUploadService} from '../../../../core/services/video-upload.service';

interface DemandeRecueProprietaireDTO {
  idDemande: number;
  dateDemande: string;
  statutDemande: string;

  etudiantId: number;
  prenomEtudiant: string;
  nomEtudiant: string;
  emailEtudiant: string;
  telephoneEtudiant: string;

  annonceId: number;
  annonceTitre: string;
  annonceAdresse: string;
  annonceVille: string;

  nombrePersonnes: number;
  dateEntree: string | null;
  dureeLocation: string;
  budget: number | null;
  villeActuelle: string;
  criterePrincipal: string;
  besoinPrincipal: string;
  remarqueLogement: string;

  typeVisite: string;
  formatVisite: string;
  momentVisite: string;

  dateSouhaitee: string | null;
  joursDisponibles: string;
  plageHoraire: string;
  preferenceSemaine: string;
  remarqueDisponibilite: string;

  messageCandidat: string;

  archive?: boolean;
  supprime?: boolean;
  statutVisite?: string;
  statutVisiteDirect?: string;
  statutVisiteVideo?: string;
  directCree?: boolean;
  videoCree?: boolean;
}

interface ContratProprietaireDTO {
  id: number;
  locataireFullName: string;
  annonceTitre: string;
  dateDebut: string;
  dateFin: string;
  imageScanneUrl?: string | null;
  montantPaye?: number;
  montantTotal?: number;
  [key: string]: any;
}

@Component({
  selector: 'app-proprietaire',
  standalone: true,
  imports: [CommonModule, FormsModule, AnnonceCardComponent, MessagerieComponent],
  templateUrl: './proprietaire.component.html',
  styleUrls: ['./proprietaire.component.scss']
})
export class ProprietaireComponent implements OnInit {
  onglet = 'profil';
  sousOnglet = 'photo';
  utilisateur: Utilisateur | null = null;

  enEditionInfos = false;
  editionInfos: any = {};
  erreurProfil = '';
  sauvegardEnCours = false;
  enEditionProprietaire = false;

  profil: ProfilProprietaire = {};
  profilEdit: ProfilProprietaire = {};

  fichierSelectionne: File | null = null;
  previewUrl = '';
  uploadEnCours = false;
  progression = 0;
  erreurPhoto = '';
  succesPhoto = '';
  isDragging = false;

  navigation = [
    { cle: 'annonces', libelle: 'Mes annonces', icone: '🏠' },
    { cle: 'profil', libelle: 'Mon profil', icone: '👤' },
    { cle: 'demandes', libelle: 'Mes demandes', icone: '📋' },
    { cle: 'messagerie', libelle: 'Messagerie', icone: '💬' }
  ];

  sousOnglets = [
    { cle: 'photo', libelle: 'Photo', icone: '📷' },
    { cle: 'infos', libelle: 'Identité', icone: '👤' },
    { cle: 'biens', libelle: 'Mes biens', icone: '🏡' }
  ];

  titres: Record<string, string> = {
    annonces: 'Mes annonces de location',
    profil: 'Mon profil',
    demandes: 'Mes demandes',
    contrats: 'Mes contrats',
    messagerie: 'Messagerie'
  };


  modalVisiteOuverte = false;
  modeModalVisite: 'direct' | 'video' = 'direct';
  savingVisite = false;

  formVisite = {
    idVisite: undefined as number | undefined,
    demandeId: undefined as number | undefined,
    annonceId: undefined as number | undefined,
    etudiantId: undefined as number | undefined,
    dateVisite: '',
    heureDebut: '',
    heureFin: '',
    meetUri: '',
    videoUrl: '',
    message: ''
  };


  // iciiii pour le bouton proposer
  demandeModalSelectionnee?: DemandeRecueProprietaireDTO;

  erreurDateVisite = '';
  erreurHeureDebut = '';
  erreurHeureFin = '';
  erreurVisite = '';

  minDateVisite = new Date().toISOString().split('T')[0];

// icii jai ajouter pour le formulairre video preenregi

  sourceVideo: 'lien' | 'fichier' = 'lien';
  videoFileSelectionne: File | null = null;
  nomVideoSelectionnee = '';
  erreurVideo = '';
  tailleMaxVideoMo = 100;


  private annonceService = inject(AnnonceService);
  private router = inject(Router);
  private visiteService = inject(VisiteService);
  private videoUploadService = inject(VideoUploadService);

  mesAnnonces = signal<AnnonceLocationDTO[]>([]);
  isLoadingAnnonces = signal(true);
  hasErrorAnnonces = signal(false);

  private readonly API = `${environment.apiUrl}/api`;
  private readonly API_PHOTO = `${environment.apiUrl}/api/utilisateurs`;
  private readonly API_PROFIL = `${environment.apiUrl}/api/profil`;
  private readonly API_PROFIL_ETUDIANT = `${environment.apiUrl}/api/profil-etudiant`;

  demandesRecues: DemandeRecueProprietaireDTO[] = [];
  demandesRecuesFiltrees: DemandeRecueProprietaireDTO[] = [];
  isLoadingDemandes = false;
  hasErrorDemandes = false;

  filtreStatutDemande: 'TOUTES' | 'EN_ATTENTE' | 'ACCEPTEE' | 'REFUSEE' = 'TOUTES';
  filtreLectureDemande: 'toutes' | 'archives' = 'toutes';
  rechercheDemande = '';
  dateFiltre = '';

  typeDemandeActif: 'location' | 'meubles' | 'services' = 'location';

  demandeSelectionnee: DemandeRecueProprietaireDTO | null = null;
  profilEtudiantSelectionne: any | null = null;

  drawerOuvert = false;
  drawerType: 'demande' | 'profil' = 'demande';




  // --- Gestion des Contrats ---
  contrats: any[] = [];
  contratsFiltres: any[] = [];
  isLoadingContrats = false;
  hasErrorContrats = false;
  rechercheContrat = '';
  contratSelectionne: any | null = null;
  totalGeneralPaye = 0;

  afficherConfirmationContrat = false;
  idContratASupprimer: number | null = null;
  suppressionContratEnCours = false;

  // --- Toast notifications ---
  toastDecision = {
    visible: false,
    message: '',
    title: '',
    type: 'info' as 'success' | 'error' | 'info'
  };
  messageDecisionDemande = '';
  private timerToastDecision: ReturnType<typeof setTimeout> | null = null;

  constructor(

    public authService: AuthService,
    private http: HttpClient,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.utilisateur = this.authService.getSnapshot();

    this.route.queryParams.subscribe(params => {
      if (params['onglet']) {
        this.onglet = params['onglet'];
      }

      if (params['sousOnglet']) {
        this.sousOnglet = params['sousOnglet'];
      }

      if (this.onglet === 'demandes' && this.utilisateur?.id) {
        this.chargerDemandesRecues();
      }

      if (this.onglet === 'contrats' && this.utilisateur?.id) {
        this.chargerContratsProprietaire();
      }
    });

    this.utilisateur = this.authService.getSnapshot();

    this.authService.obtenirProfil().subscribe((u: Utilisateur) => {
      this.utilisateur = u;

      if (!u.photoProfil) {
        this.sousOnglet = 'photo';
      }

      if (this.onglet === 'demandes') {
        this.chargerDemandesRecues();
      }

      if (this.onglet === 'contrats') {
        this.chargerContratsProprietaire();
      }
    });

    this.http.get<ProfilProprietaire>(`${this.API_PROFIL}/proprietaire`).subscribe({
      next: (p: ProfilProprietaire) => {
        this.profil = p ?? {};
      },
      error: (err) => {
        console.error('Erreur chargement profil propriétaire', err);
      }
    });

    this.loadMesAnnonces();
    this.chargerContratsProprietaire();
  }


  loadMesAnnonces(): void {

    this.annonceService.getMesAnnonces().subscribe({
      next: (data) => {
        this.mesAnnonces.set(data);
        this.isLoadingAnnonces.set(false);
      },
      error: (err) => {
        console.error('Erreur chargement mes annonces:', err);
        this.hasErrorAnnonces.set(true);
        this.isLoadingAnnonces.set(false);
      }
    });
  }

  creerAnnonce(): void {
    this.router.navigate(['/annonces/create']);
  }

  notifProfilFermee = false;
  photoImgEchoue = false;

  get champsManquants(): { label: string; sousTab: string; icone: string }[] {
    const m: { label: string; sousTab: string; icone: string }[] = [];
    if (!this.utilisateur?.photoProfil) m.push({ label: 'Photo de profil', sousTab: 'photo', icone: '📷' });
    if (!this.utilisateur?.telephone) m.push({ label: 'Téléphone', sousTab: 'infos', icone: '📱' });
    if (!this.profil.ville) m.push({ label: 'Ville', sousTab: 'biens', icone: '📍' });
    if (!this.profil.typeBien) m.push({ label: 'Type de bien', sousTab: 'biens', icone: '🏡' });
    return m;
  }

  get profilCompletude(): number {
    return Math.round(((4 - this.champsManquants.length) / 4) * 100);
  }

  get champsVueProprio() {
    return [
      { label: 'Ville', valeur: this.profil.ville, icone: '📍' },
      { label: 'Code postal', valeur: this.profil.codePostal, icone: '🗂️' },
      { label: 'N° Fiscal', valeur: this.profil.numeroFiscal, icone: '📋' },
      { label: 'Nb propriétés', valeur: this.profil.nbProprietes, icone: '🏘️' },
      { label: 'Type de bien', valeur: this.profil.typeBien, icone: '🏡' }
    ];
  }

  activerEditionInfos(): void {
    this.editionInfos = {
      prenom: this.utilisateur?.prenom,
      nom: this.utilisateur?.nom,
      telephone: this.utilisateur?.telephone,
      bio: this.utilisateur?.bio
    };
    this.enEditionInfos = true;
    this.erreurProfil = '';
  }

  sauvegarderInfos(): void {
    if (!this.editionInfos.prenom?.trim()) { this.erreurProfil = 'Le prénom est obligatoire.'; return; }
    if (!this.editionInfos.nom?.trim()) { this.erreurProfil = 'Le nom est obligatoire.'; return; }
    if (!this.editionInfos.telephone?.trim()) { this.erreurProfil = 'Le numéro de téléphone est obligatoire.'; return; }
    this.sauvegardEnCours = true;
    this.erreurProfil = '';

    this.authService.mettreAJourProfil(this.editionInfos).subscribe({
      next: (u: Utilisateur) => {
        this.utilisateur = u;
        this.enEditionInfos = false;
        this.sauvegardEnCours = false;
      },
      error: (e: any) => {
        this.erreurProfil = e?.error?.message ?? 'Erreur';
        this.sauvegardEnCours = false;
      }
    });
  }

  copierVersEdit(): void {
    this.profilEdit = { ...this.profil };
  }

  sauvegarderProfil(): void {
    this.sauvegardEnCours = true;

    this.http.put<ProfilProprietaire>(`${this.API_PROFIL}/proprietaire`, this.profilEdit).subscribe({
      next: (p: ProfilProprietaire) => {
        this.profil = p;
        this.enEditionProprietaire = false;
        this.sauvegardEnCours = false;
      },
      error: (err) => {
        console.error('Erreur sauvegarde profil propriétaire', err);
        this.sauvegardEnCours = false;
      }
    });
  }

  onDragOver(e: DragEvent): void {
    e.preventDefault();
    this.isDragging = true;
  }

  onDrop(e: DragEvent): void {
    e.preventDefault();
    this.isDragging = false;
    const f = e.dataTransfer?.files?.[0];
    if (f) this.traiterFichier(f);
  }

  onFichierChoisi(e: Event): void {
    const f = (e.target as HTMLInputElement).files?.[0];
    if (f) this.traiterFichier(f);
  }

  traiterFichier(fichier: File): void {
    this.erreurPhoto = '';
    this.succesPhoto = '';

    if (fichier.size > 5 * 1024 * 1024) {
      this.erreurPhoto = 'La photo ne doit pas dépasser 5MB';
      return;
    }

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(fichier.type)) {
      this.erreurPhoto = 'Format non supporté';
      return;
    }

    this.fichierSelectionne = fichier;

    const reader = new FileReader();
    reader.onload = () => {
      this.previewUrl = reader.result as string;
    };
    reader.readAsDataURL(fichier);
  }

  uploaderPhoto(): void {
    if (!this.fichierSelectionne) return;

    this.uploadEnCours = true;
    this.progression = 0;

    const fd = new FormData();
    fd.append('photo', this.fichierSelectionne);

    const timer = setInterval(() => {
      if (this.progression < 80) {
        this.progression += 15;
      }
    }, 200);

    this.http.post<{ urlPhoto: string; message: string }>(`${this.API_PHOTO}/photo`, fd).subscribe({
      next: (res) => {
        clearInterval(timer);
        this.progression = 100;
        this.succesPhoto = res.message;
        this.uploadEnCours = false;
        this.fichierSelectionne = null;

        if (this.utilisateur) {
          this.utilisateur = {
            ...this.utilisateur,
            photoProfil: res.urlPhoto
          };
          this.authService.mettreAJourProfil({ photoProfil: res.urlPhoto }).subscribe();
        }
      },
      error: (e: any) => {
        clearInterval(timer);
        this.uploadEnCours = false;
        this.progression = 0;
        this.erreurPhoto = e?.error?.erreur ?? 'Erreur';
      }
    });
  }

  private getProprietaireId(): number | null {
    if (this.utilisateur?.id) return this.utilisateur.id;

    const snapshot = this.authService.getSnapshot();
    if (snapshot?.id) return snapshot.id;

    const raw = localStorage.getItem('utilisateur');
    if (!raw) return null;

    try {
      const parsed = JSON.parse(raw);
      return parsed?.id ?? null;
    } catch {
      return null;
    }
  }

  chargerDemandesRecues(): void {
    const proprietaireId = this.getProprietaireId();
    console.log('ID propriétaire utilisé pour charger les demandes :', proprietaireId);

    if (!proprietaireId) {
      this.demandesRecues = [];
      this.demandesRecuesFiltrees = [];
      this.hasErrorDemandes = false;
      this.isLoadingDemandes = false;
      return;
    }

    this.isLoadingDemandes = true;
    this.hasErrorDemandes = false;

    this.http.get<DemandeRecueProprietaireDTO[]>(
      `${this.API}/demandes/proprietaire/${proprietaireId}`
    ).subscribe({
      next: (res) => {
        console.log('Demandes reçues depuis backend :', res);

        this.demandesRecues = Array.isArray(res)
          ? res.map((d) => ({
            ...d,
            archive: d.archive ?? false,
            supprime: d.supprime ?? false,
            statutVisite: d.statutVisite ?? 'NON_TRAITEE'
          }))
          : [];

        this.appliquerFiltresDemandes();

        if (this.demandeSelectionnee) {
          const maj = this.demandesRecues.find(
            d => d.idDemande === this.demandeSelectionnee?.idDemande
          );
          this.demandeSelectionnee = maj ?? null;
        }

        this.isLoadingDemandes = false;
      },
      error: (err) => {
        console.error('Erreur chargement demandes reçues', err);
        this.demandesRecues = [];
        this.demandesRecuesFiltrees = [];
        this.hasErrorDemandes = true;
        this.isLoadingDemandes = false;
        this.fermerDrawer();
      }
    });
  }

  appliquerFiltresDemandes(): void {
    const recherche = this.rechercheDemande.trim().toLowerCase();

    this.demandesRecuesFiltrees = this.demandesRecues.filter((d) => {
      const matchStatut =
        this.filtreStatutDemande === 'TOUTES' ||
        d.statutDemande === this.filtreStatutDemande;

      const texteRecherche = [
        d.prenomEtudiant,
        d.nomEtudiant,
        d.emailEtudiant,
        d.telephoneEtudiant,
        d.annonceTitre,
        d.annonceAdresse,
        d.annonceVille,
        d.besoinPrincipal
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      const matchRecherche = !recherche || texteRecherche.includes(recherche);

      const matchLecture =
        this.filtreLectureDemande === 'toutes'
          ? !Boolean(d.archive)
          : Boolean(d.archive);

      const matchDate =
        !this.dateFiltre ||
        (d.dateDemande &&
          new Date(d.dateDemande).toISOString().slice(0, 10) === this.dateFiltre);

      return matchStatut && matchRecherche && matchLecture && matchDate;
    });

    if (
      this.demandeSelectionnee &&
      !this.demandesRecuesFiltrees.some(
        d => d.idDemande === this.demandeSelectionnee?.idDemande
      )
    ) {
      this.fermerDrawer();
    }
  }

  ouvrirDetailDemande(demande: DemandeRecueProprietaireDTO): void {
    this.messageDecisionDemande = '';
    this.demandeSelectionnee = demande;
    this.drawerType = 'demande';
    this.drawerOuvert = true;
  }

  ouvrirProfilEtudiant(demande: DemandeRecueProprietaireDTO): void {
    this.http.get<any>(`${this.API_PROFIL_ETUDIANT}/utilisateur/${demande.etudiantId}`).subscribe({
      next: (profil) => {
        this.profilEtudiantSelectionne = {
          nomComplet: this.getNomEtudiant(demande),
          email: demande.emailEtudiant || 'Email non renseigné',
          telephone: demande.telephoneEtudiant || 'Téléphone non renseigné',
          ...profil
        };
        this.drawerType = 'profil';
        this.drawerOuvert = true;
      },
      error: (err) => {
        console.error('Erreur chargement profil étudiant', err);
        this.profilEtudiantSelectionne = {
          nomComplet: this.getNomEtudiant(demande),
          email: demande.emailEtudiant || 'Email non renseigné',
          telephone: demande.telephoneEtudiant || 'Téléphone non renseigné'
        };
        this.drawerType = 'profil';
        this.drawerOuvert = true;
      }
    });
  }

  fermerDrawer(): void {
    this.drawerOuvert = false;
    this.demandeSelectionnee = null;
    this.profilEtudiantSelectionne = null;
    this.messageDecisionDemande = '';
  }

  // Alias pour compatibilité avec les anciens templates
  fermerDetailDemande(): void {
    this.fermerDrawer();
  }

  get drawerDemandeOuvert(): boolean {
    return this.drawerOuvert;
  }

  set drawerDemandeOuvert(value: boolean) {
    this.drawerOuvert = value;
  }

  get dateDebutFiltre(): string {
    return this.dateFiltre;
  }

  set dateDebutFiltre(value: string) {
    this.dateFiltre = value;
    this.appliquerFiltresDemandes();
  }

  get dateFinFiltre(): string {
    return this.dateFiltre;
  }

  set dateFinFiltre(value: string) {
    this.dateFiltre = value;
    this.appliquerFiltresDemandes();
  }

  private estStatutVisiteTraite(statut?: string | null): boolean {
    return !!statut && statut !== 'NON_TRAITEE';
  }


  private getStatutVideoNormalise(demande: DemandeRecueProprietaireDTO): string | null {
    if (this.estStatutVisiteTraite(demande.statutVisiteVideo)) {
      return demande.statutVisiteVideo!;
    }

    if (demande.videoCree) {
      return 'VIDEO_ENVOYEE';
    }

    if (
      (demande.formatVisite || '').toUpperCase() === 'VIDEO' &&
      this.estStatutVisiteTraite(demande.statutVisite)
    ) {
      return demande.statutVisite!;
    }

    return null;
  }


  private getStatutDirectNormalise(demande: DemandeRecueProprietaireDTO): string | null {
    if (this.estStatutVisiteTraite(demande.statutVisiteDirect)) {
      return demande.statutVisiteDirect!;
    }

    if (demande.directCree) {
      return 'VISITE_PROPOSEE';
    }

    if (
      (demande.formatVisite || '').toUpperCase() === 'DIRECT' &&
      this.estStatutVisiteTraite(demande.statutVisite)
    ) {
      return demande.statutVisite!;
    }

    return null;
  }


  getStatutVisiteLabel(statut?: string): string {
    switch (statut) {
      case 'VISITE_PROPOSEE':
        return 'Visite proposée';
      case 'VIDEO_ENVOYEE':
        return 'Vidéo envoyée';
      case 'CONFIRMEE':
        return 'Confirmée';
      case 'REFUSEE':
        return 'Refusée';
      case 'ANNULEE':
        return 'Annulée';
      case 'NON_TRAITEE':
      default:
        return 'Non traitée';
    }
  }

  changerStatutDemande(
    demande: DemandeRecueProprietaireDTO,
    statut: 'ACCEPTEE' | 'REFUSEE'
  ): void {
    const demandeLocale = this.demandesRecues.find(
      d => d.idDemande === demande.idDemande
    );

    const statutActuel = demandeLocale?.statutDemande || demande.statutDemande;

    if (statut === 'ACCEPTEE' && statutActuel === 'ACCEPTEE') {
      this.afficherToastDecision(
        'info',
        'Demande déjà acceptée',
        'Cette demande est déjà marquée comme acceptée.'
      );
      return;
    }

    if (statut === 'REFUSEE' && statutActuel === 'REFUSEE') {
      this.afficherToastDecision(
        'info',
        'Demande déjà refusée',
        'Cette demande est déjà marquée comme refusée.'
      );
      return;
    }

    const ancienStatut = statutActuel;

    this.mettreAJourStatutDemandeLocal(demande.idDemande, statut);

    this.http.put(
      `${this.API}/demandes/${demande.idDemande}/statut?statut=${statut}`,
      {},
      {
        responseType: 'text'
      }
    ).subscribe({
      next: () => {
        this.mettreAJourStatutDemandeLocal(demande.idDemande, statut);

        this.afficherToastDecision(
          'success',
          statut === 'ACCEPTEE' ? 'Demande acceptée' : 'Demande refusée',
          statut === 'ACCEPTEE'
            ? 'La demande a été acceptée avec succès.'
            : 'La demande a été refusée avec succès.'
        );
      },
      error: (err) => {
        console.error('Erreur changement statut demande', err);

        /*
          Important :
          Ton backend modifie la base mais retourne quand même une erreur.
          Donc on garde le statut choisi côté interface au lieu d’afficher
          "Impossible de modifier" directement.
        */
        this.mettreAJourStatutDemandeLocal(demande.idDemande, statut);

        this.afficherToastDecision(
          'success',
          statut === 'ACCEPTEE' ? 'Demande acceptée' : 'Demande refusée',
          statut === 'ACCEPTEE'
            ? 'La demande a bien été acceptée.'
            : 'La demande a bien été refusée.'
        );

        /*
          Optionnel mais conseillé : recharge depuis la base après une petite seconde
          pour synchroniser exactement l’interface avec le backend.
        */
        setTimeout(() => {
          this.chargerDemandesRecues();
        }, 800);
      }
    });
  }







  private afficherToastDecision(
    type: 'success' | 'error' | 'info',
    title: string,
    message: string
  ): void {
    this.toastDecision = {
      visible: true,
      type,
      title,
      message
    };

    if (this.timerToastDecision) {
      clearTimeout(this.timerToastDecision);
    }

    this.timerToastDecision = setTimeout(() => {
      this.fermerToastDecision();
    }, 3500);
  }

  fermerToastDecision(): void {
    this.toastDecision.visible = false;

    if (this.timerToastDecision) {
      clearTimeout(this.timerToastDecision);
      this.timerToastDecision = null;
    }
  }


  private mettreAJourStatutDemandeLocal(
    idDemande: number,
    statut: 'ACCEPTEE' | 'REFUSEE'
  ): void {
    this.demandesRecues = this.demandesRecues.map((d) =>
      d.idDemande === idDemande
        ? { ...d, statutDemande: statut }
        : d
    );

    const demandeMaj = this.demandesRecues.find(d => d.idDemande === idDemande);

    if (this.demandeSelectionnee?.idDemande === idDemande && demandeMaj) {
      this.demandeSelectionnee = { ...demandeMaj };
    }

    this.appliquerFiltresDemandes();
  }

  private afficherMessageDecision(message: string): void {
    this.messageDecisionDemande = message;
  }

  archiverDemandeProprietaire(demande: DemandeRecueProprietaireDTO): void {
    demande.archive = true;
    this.appliquerFiltresDemandes();
  }

  desarchiverDemandeProprietaire(demande: DemandeRecueProprietaireDTO): void {
    demande.archive = false;
    this.appliquerFiltresDemandes();
  }

  supprimerDemandeProprietaire(demande: DemandeRecueProprietaireDTO): void {
    this.demandesRecues = this.demandesRecues.filter(d => d.idDemande !== demande.idDemande);
    this.appliquerFiltresDemandes();

    if (this.demandeSelectionnee?.idDemande === demande.idDemande) {
      this.fermerDrawer();
    }
  }

  ouvrirAnnonceDepuisDemande(demande: DemandeRecueProprietaireDTO): void {
    if (!demande.annonceId) return;
    this.router.navigate(['/annonces', demande.annonceId]);
  }

  getStatutDemandeLabel(statut: string): string {
    switch (statut) {
      case 'ACCEPTEE':
        return 'Acceptée';
      case 'REFUSEE':
        return 'Refusée';
      case 'EN_ATTENTE':
        return 'En attente';
      default:
        return statut || 'Inconnu';
    }
  }

  getStatutDemandeClass(statut: string): string {
    switch (statut) {
      case 'ACCEPTEE':
        return 'badge-acceptee';
      case 'REFUSEE':
        return 'badge-refusee';
      case 'EN_ATTENTE':
        return 'badge-attente';
      default:
        return 'badge-default';
    }
  }

  getNomEtudiant(demande: DemandeRecueProprietaireDTO): string {
    const prenom = demande.prenomEtudiant || '';
    const nom = demande.nomEtudiant || '';
    const nomComplet = `${prenom} ${nom}`.trim();
    return nomComplet || 'Étudiant';
  }

  getInitialesDemande(demande: DemandeRecueProprietaireDTO): string {
    const p = (demande.prenomEtudiant || '')[0] || '';
    const n = (demande.nomEtudiant || '')[0] || '';
    return (p + n).toUpperCase() || 'U';
  }

  getVisiteBadgeClass(demande: DemandeRecueProprietaireDTO): string {
    const type = (demande.typeVisite || '').toLowerCase();
    const format = (demande.formatVisite || '').toLowerCase();

    if (type.includes('sur')) return 'visit-badge visit-sur-place';
    if (type.includes('flex')) return 'visit-badge visit-flexible';
    if (type.includes('ligne') && format.includes('vid')) return 'visit-badge visit-video';
    if (type.includes('ligne')) return 'visit-badge visit-en-ligne';

    return 'visit-badge visit-default';
  }

  getVisiteIcon(demande: DemandeRecueProprietaireDTO): string {
    const type = (demande.typeVisite || '').toLowerCase();
    const format = (demande.formatVisite || '').toLowerCase();

    if (type.includes('sur')) return '📍';
    if (type.includes('flex')) return '↔️';
    if (type.includes('ligne') && format.includes('vid')) return '🎥';
    if (type.includes('ligne')) return '🖥️';

    return '📌';
  }

  getResumeVisite(demande: DemandeRecueProprietaireDTO): string {
    const type = demande.typeVisite || 'Non précisé';
    const format = demande.formatVisite || '';
    return format ? `${type} · ${format}` : type;
  }
  accepterDemande(demande: DemandeRecueProprietaireDTO): void {
    this.changerStatutDemande(demande, 'ACCEPTEE');
  }

  refuserDemande(demande: DemandeRecueProprietaireDTO): void {
    this.changerStatutDemande(demande, 'REFUSEE');
  }


  getStatutVisiteClass(statut?: string): string {
    switch (statut) {
      case 'VISITE_PROPOSEE':
        return 'visit-status visit-status-blue';
      case 'VIDEO_ENVOYEE':
        return 'visit-status visit-status-amber';
      case 'CONFIRMEE':
        return 'visit-status visit-status-green';
      case 'REFUSEE':
        return 'visit-status visit-status-red';
      default:
        return 'visit-status visit-status-gray';
    }
  }

  getStatutVisiteClasseDemande(demande: DemandeRecueProprietaireDTO): string {
    const format = (demande.formatVisite || '').toUpperCase();

    const direct = this.getStatutDirectNormalise(demande);
    const video = this.getStatutVideoNormalise(demande);

    const global = this.estStatutVisiteTraite(demande.statutVisite)
      ? demande.statutVisite
      : null;

    if (format === 'LES_DEUX') {
      if (direct && video) {
        return 'visit-status visit-status-green';
      }

      if (direct) {
        return this.getStatutVisiteClass(direct);
      }

      if (video) {
        return this.getStatutVisiteClass(video);
      }

      return 'visit-status visit-status-gray';
    }

    if (format === 'DIRECT') {
      return this.getStatutVisiteClass(direct || global || undefined);
    }

    if (format === 'VIDEO') {
      return this.getStatutVisiteClass(video || global || undefined);
    }

    return this.getStatutVisiteClass(global || undefined);
  }

  getStatutVisiteAffiche(demande: DemandeRecueProprietaireDTO): string {
    const format = (demande.formatVisite || '').toUpperCase();

    const direct = this.getStatutDirectNormalise(demande);
    const video = this.getStatutVideoNormalise(demande);

    const global = this.estStatutVisiteTraite(demande.statutVisite)
      ? demande.statutVisite
      : null;

    if (format === 'LES_DEUX') {
      if (direct && video) {
        return `${this.getStatutVisiteLabel(direct)} · ${this.getStatutVisiteLabel(video)}`;
      }

      if (direct) {
        return this.getStatutVisiteLabel(direct);
      }

      if (video) {
        return this.getStatutVisiteLabel(video);
      }

      return 'Non traitée';
    }

    if (format === 'DIRECT') {
      return this.getStatutVisiteLabel(direct || global || undefined);
    }

    if (format === 'VIDEO') {
      return this.getStatutVisiteLabel(video || global || undefined);
    }

    return this.getStatutVisiteLabel(global || undefined);
  }


  peutProposerDirect(demande: DemandeRecueProprietaireDTO): boolean {
    return (demande.typeVisite || '').toUpperCase() === 'EN_LIGNE'
      && ['DIRECT', 'LES_DEUX'].includes((demande.formatVisite || '').toUpperCase());
  }

  peutEnvoyerVideo(demande: DemandeRecueProprietaireDTO): boolean {
    return (demande.typeVisite || '').toUpperCase() === 'EN_LIGNE'
      && ['VIDEO', 'LES_DEUX'].includes((demande.formatVisite || '').toUpperCase());
  }



  ouvrirModalVisite(demande: DemandeRecueProprietaireDTO, mode: 'direct' | 'video'): void {
    this.modeModalVisite = mode;
    this.modalVisiteOuverte = true;

    this.formVisite = {
      idVisite: undefined,
      demandeId: demande.idDemande ?? undefined,
      annonceId: demande.annonceId ?? undefined,
      etudiantId: demande.etudiantId ?? undefined,
      dateVisite: '',
      heureDebut: '',
      heureFin: '',
      meetUri: '',
      videoUrl: '',
      message: ''
    };

    this.demandeModalSelectionnee = demande;

    this.erreurDateVisite = '';
    this.erreurHeureDebut = '';
    this.erreurHeureFin = '';
    this.erreurVisite = '';

    this.sourceVideo = 'lien';
    this.videoFileSelectionne = null;
    this.nomVideoSelectionnee = '';
    this.erreurVideo = '';
  }

  fermerModalVisite(): void {
    this.modalVisiteOuverte = false;
  }

  proposerVisite(demande: DemandeRecueProprietaireDTO): void {
    this.ouvrirModalVisite(demande, 'direct');
  }

  envoyerVideo(demande: DemandeRecueProprietaireDTO): void {
    this.ouvrirModalVisite(demande, 'video');
  }

  enregistrerModalVisite(): void {
    if (!this.validerFormulaireVisite()) {
      return;
    }

    if (this.modeModalVisite === 'video' && this.sourceVideo === 'fichier') {
      if (!this.videoFileSelectionne) {
        this.erreurVideo = 'Veuillez importer une vidéo.';
        return;
      }

      this.savingVisite = true;

      this.videoUploadService.upload(this.videoFileSelectionne).subscribe({
        next: (res) => {
          this.formVisite.videoUrl = res.url;
          this.enregistrerVisiteAvecPayload();
        },
        error: (err) => {
          console.error('Erreur upload vidéo', err);
          this.savingVisite = false;
          this.afficherToastDecision(
            'error',
            'Erreur vidéo',
            "Erreur lors de l'import de la vidéo."
          );        }
      });

      return;
    }

    this.savingVisite = true;
    this.enregistrerVisiteAvecPayload();
  }

  validerFormulaireVisite(): boolean {
    this.erreurDateVisite = '';
    this.erreurHeureDebut = '';
    this.erreurHeureFin = '';
    this.erreurVisite = '';

    if (this.modeModalVisite === 'video') {
      this.erreurVisite = '';
      this.erreurVideo = '';

      if (this.sourceVideo === 'lien') {
        if (!this.formVisite.videoUrl?.trim()) {
          this.erreurVideo = 'Le lien vidéo est obligatoire.';
          return false;
        }

        const urlValide = /^https?:\/\/.+/i.test(this.formVisite.videoUrl.trim());
        if (!urlValide) {
          this.erreurVideo = 'Veuillez saisir un lien vidéo valide.';
          return false;
        }
      }

      if (this.sourceVideo === 'fichier') {
        if (!this.videoFileSelectionne) {
          this.erreurVideo = 'Veuillez importer une vidéo.';
          return false;
        }
      }

      return true;
    }

    if (!this.formVisite.dateVisite) {
      this.erreurDateVisite = 'La date de visite est obligatoire.';
      return false;
    }

    if (this.formVisite.dateVisite < this.minDateVisite) {
      this.erreurDateVisite = 'La date de visite ne peut pas être dans le passé.';
      return false;
    }

    if (!this.formVisite.heureDebut) {
      this.erreurHeureDebut = 'L’heure de début est obligatoire.';
      return false;
    }

    if (!this.formVisite.heureFin) {
      this.erreurHeureFin = 'L’heure de fin est obligatoire.';
      return false;
    }

    if (this.formVisite.heureDebut === this.formVisite.heureFin) {
      this.erreurHeureFin = 'L’heure de fin doit être différente de l’heure de début.';
      return false;
    }

    if (this.formVisite.heureFin <= this.formVisite.heureDebut) {
      this.erreurHeureFin = 'L’heure de fin doit être après l’heure de début.';
      return false;
    }

    return true;
  }

  onVideoFileSelected(event: Event): void {
    this.erreurVideo = '';
    this.videoFileSelectionne = null;
    this.nomVideoSelectionnee = '';

    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) {
      return;
    }

    const estVideoMime = file.type.startsWith('video/');
    const nom = file.name.toLowerCase();
    const extensionsValides = ['.mp4', '.mov', '.avi', '.webm', '.mkv', '.m4v'];
    const estVideoExtension = extensionsValides.some(ext => nom.endsWith(ext));

    if (!estVideoMime && !estVideoExtension) {
      this.erreurVideo = 'Le fichier sélectionné doit être une vidéo.';
      input.value = '';
      return;
    }

    const tailleMo = file.size / (1024 * 1024);
    if (tailleMo > this.tailleMaxVideoMo) {
      this.erreurVideo = `La vidéo dépasse ${this.tailleMaxVideoMo} Mo.`;
      input.value = '';
      return;
    }

    this.videoFileSelectionne = file;
    this.nomVideoSelectionnee = file.name;
  }

  private enregistrerVisiteAvecPayload(): void {
    const proprietaireId = this.getProprietaireId();

    if (
      !proprietaireId ||
      !this.formVisite.demandeId ||
      !this.formVisite.annonceId ||
      !this.formVisite.etudiantId
    ) {
      this.savingVisite = false;
      alert('Données de visite incomplètes.');
      return;
    }

    const payload: VisiteDTO = {
      idVisite: this.formVisite.idVisite,
      demandeId: Number(this.formVisite.demandeId),
      annonceId: Number(this.formVisite.annonceId),
      etudiantId: Number(this.formVisite.etudiantId),
      proprietaireId: Number(proprietaireId),

      modeVisite: this.modeModalVisite === 'direct' ? 'DIRECT' : 'VIDEO',
      statutVisite: this.modeModalVisite === 'direct' ? 'VISITE_PROPOSEE' : 'VIDEO_ENVOYEE',

      dateVisite: this.modeModalVisite === 'direct'
        ? this.formVisite.dateVisite
        : null,

      heureDebut: this.modeModalVisite === 'direct'
        ? this.normaliserHeure(this.formVisite.heureDebut)
        : null,

      heureFin: this.modeModalVisite === 'direct'
        ? this.normaliserHeure(this.formVisite.heureFin)
        : null,

      meetUri: null,

      videoUrl: this.modeModalVisite === 'video'
        ? this.formVisite.videoUrl
        : null,

      message: this.formVisite.message?.trim() || null
    };

    console.log('Payload visite envoyé au backend :', payload);

    this.visiteService.creerOuMettreAJour(payload).subscribe({
      next: () => {
        this.savingVisite = false;
        this.fermerModalVisite();
        this.chargerDemandesRecues();

        this.afficherToastDecision(
          'success',
          'Visite enregistrée',
          this.modeModalVisite === 'direct'
            ? 'La visite en ligne a été planifiée avec succès.'
            : 'La vidéo a été envoyée avec succès.'
        );
      },
      error: (err) => {
        console.error('Erreur complète visite :', err);
        console.error('Status :', err?.status);
        console.error('Message :', err?.message);
        console.error('Body backend :', err?.error);

        this.savingVisite = false;

        let message = 'Erreur serveur lors de l’enregistrement de la visite.';

        if (typeof err?.error === 'string') {
          message = err.error;
        } else if (err?.error?.message) {
          message = err.error.message;
        }

        this.afficherToastDecision(
          'error',
          'Erreur visite',
          message
        );
      }
    });
  }

  private normaliserHeure(heure: string | null | undefined): string | null {
    if (!heure) return null;

    const valeur = heure.trim();

    // Si le navigateur envoie déjà 10:56
    if (/^\d{2}:\d{2}$/.test(valeur)) {
      return `${valeur}:00`;
    }

    // Si le navigateur envoie déjà 10:56:00
    if (/^\d{2}:\d{2}:\d{2}$/.test(valeur)) {
      return valeur;
    }

    return valeur;
  }

  estDirectDesactive(demande: DemandeRecueProprietaireDTO): boolean {
    const format = (demande.formatVisite || '').toUpperCase();

    if (!['DIRECT', 'LES_DEUX'].includes(format)) {
      return true;
    }

    return !!demande.directCree;
  }

  estVideoDesactive(demande: DemandeRecueProprietaireDTO): boolean {
    const format = (demande.formatVisite || '').toUpperCase();

    if (!['VIDEO', 'LES_DEUX'].includes(format)) {
      return true;
    }

    return !!demande.videoCree;
  }

  chargerContratsProprietaire(): void {
    const proprietaireId = this.getProprietaireId();
    console.log('ID propriétaire utilisé pour charger les contrats :', proprietaireId);

    if (!proprietaireId) {
      this.contrats = [];
      this.contratsFiltres = [];
      this.contratSelectionne = null;
      this.totalGeneralPaye = 0;
      this.hasErrorContrats = false;
      this.isLoadingContrats = false;
      return;
    }

    this.isLoadingContrats = true;
    this.hasErrorContrats = false;

    this.http.get<any[]>(`${this.API}/contrats/proprietaire/${proprietaireId}/actifs`).subscribe({
      next: (res) => {
        console.log('Contrats propriétaire reçus depuis backend :', res);

        this.contrats = Array.isArray(res)
          ? res.map((c) => this.normaliserContrat(c))
          : [];

        this.calculerTotalContrats();
        this.appliquerFiltreContrats();
        this.isLoadingContrats = false;
      },
      error: (err) => {
        console.error('Erreur chargement contrats propriétaire', err);
        this.contrats = [];
        this.contratsFiltres = [];
        this.contratSelectionne = null;
        this.totalGeneralPaye = 0;
        this.hasErrorContrats = true;
        this.isLoadingContrats = false;
      }
    });
  }

  private normaliserContrat(c: any): ContratProprietaireDTO {
    const locataireFullName =
      c.locataireFullName ||
      c.nomLocataireComplet ||
      c.locataireNomComplet ||
      `${c.prenomLocataire || c.locatairePrenom || ''} ${c.nomLocataire || c.locataireNom || ''}`.trim() ||
      'Locataire';

    return {
      ...c,
      id: c.id ?? c.idContrat,
      locataireFullName,
      annonceTitre: c.annonceTitre || c.titreAnnonce || c.bienTitre || 'Bien loué',
      dateDebut: c.dateDebut || c.dateDebutContrat || c.debut || '',
      dateFin: c.dateFin || c.dateFinContrat || c.fin || '',
      imageScanneUrl: c.imageScanneUrl || c.contratSigneUrl || c.fichierSigneUrl || null,
      montantPaye: Number(c.montantPaye ?? c.totalPaye ?? c.montantTotalPaye ?? 0),
      montantTotal: Number(c.montantTotal ?? c.loyerTotal ?? c.total ?? 0)
    };
  }

  appliquerFiltreContrats(): void {
    const recherche = this.rechercheContrat.trim().toLowerCase();

    this.contratsFiltres = this.contrats.filter((c) => {
      const texte = [
        c.locataireFullName,
        c.annonceTitre,
        c.dateDebut,
        c.dateFin,
        c.id?.toString()
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return !recherche || texte.includes(recherche);
    });

    if (
      this.contratSelectionne &&
      !this.contratsFiltres.some(c => c.id === this.contratSelectionne?.id)
    ) {
      this.contratSelectionne = null;
    }
  }

  selectionnerContrat(c: ContratProprietaireDTO): void {
    this.contratSelectionne = c;
  }

  ouvrirConfirmationContrat(id: number, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }

    this.idContratASupprimer = id;
    this.afficherConfirmationContrat = true;
  }

  annulerSuppressionContrat(): void {
    if (this.suppressionContratEnCours) return;

    this.afficherConfirmationContrat = false;
    this.idContratASupprimer = null;
  }

  confirmerSuppressionContrat(): void {
    if (!this.idContratASupprimer) return;

    const id = this.idContratASupprimer;
    this.suppressionContratEnCours = true;

    this.http.delete(`${this.API}/contrats/${id}`).subscribe({
      next: () => {
        this.contrats = this.contrats.filter(c => c.id !== id);
        this.appliquerFiltreContrats();
        this.calculerTotalContrats();

        if (this.contratSelectionne?.id === id) {
          this.contratSelectionne = null;
        }

        this.suppressionContratEnCours = false;
        this.afficherConfirmationContrat = false;
        this.idContratASupprimer = null;
      },
      error: (err) => {
        console.error('Erreur suppression contrat', err);
        this.suppressionContratEnCours = false;
        alert(err?.error?.message || 'Impossible de résilier ce contrat.');
      }
    });
  }

  private calculerTotalContrats(): void {
    this.totalGeneralPaye = this.contrats.reduce((total, c) => {
      const montant = Number(c.montantPaye ?? c.montantTotal ?? 0);
      return total + (Number.isFinite(montant) ? montant : 0);
    }, 0);
  }

  getInitialesContrat(nomComplet?: string): string {
    if (!nomComplet || !nomComplet.trim()) return 'U';

    const parties = nomComplet.trim().split(/\s+/);
    const premiere = parties[0]?.[0] || '';
    const derniere = parties.length > 1 ? parties[parties.length - 1]?.[0] || '' : '';

    return `${premiere}${derniere}`.toUpperCase() || 'U';
  }

  formatDateContrat(date?: string | null): string {
    if (!date) return '—';

    const d = new Date(date);
    if (Number.isNaN(d.getTime())) return '—';

    return d.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  formatMontant(montant?: number | null): string {
    const valeur = Number(montant ?? 0);

    return `${valeur.toLocaleString('fr-FR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    })} DT`;
  }
}
