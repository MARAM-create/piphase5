import { Component, OnInit, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Router } from '@angular/router';
import { PickerComponent } from '@ctrl/ngx-emoji-mart';
type FiltreConversation = 'TOUTES' | 'LOCATION' | 'MATCHING' | 'EN_ATTENTE' | 'NON_LUS' | 'ACTIVES';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { AppelMessage, AppelMessagerieService } from '../../core/services/appelmessagerie.service';
@Component({
  selector: 'app-messagerie',
  standalone: true,
  imports: [CommonModule, FormsModule,PickerComponent],
  templateUrl: './messagerie.component.html',
  styleUrls: ['./messagerie.component.scss']
})
export class MessagerieComponent implements OnInit, AfterViewChecked {

  @ViewChild('messagesContainer') private messagesContainer!: ElementRef;

  private API = `${environment.apiUrl}/api`;
  utilisateurConnecte: any = null;

  conversations: any[] = [];
  conversationSelectionnee: any = null;
  messages: any[] = [];

  nouveauMessage = '';
  rechercheConversation = '';
  filtreActif: FiltreConversation = 'TOUTES';

  chargementMessages = false;
  private shouldScrollToBottom = false;

  unreadByConversation: { [key: number]: number } = {};
  messageMenuOuvertId: number | null = null;
  messageEnEdition: any = null;
  contenuEdition = '';
  reactionPickerMessageId: number | null = null;

  reactionsRapides = ['❤️', '😂', '😮', '😢', '👍', '🙏'];


  constructor(
    private http: HttpClient,
    private route: ActivatedRoute,
    private router: Router,
    private sanitizer: DomSanitizer,
    private appelService: AppelMessagerieService
  ) {}

  ngOnInit(): void {
    const raw = localStorage.getItem('utilisateur');
    if (!raw) return;
    this.utilisateurConnecte = JSON.parse(raw);
    if (this.utilisateurConnecte?.id) {
      this.appelService.connecter(this.utilisateurConnecte.id);

      this.appelService.appelRecu$.subscribe((appel: AppelMessage) => {
        this.gererEvenementAppel(appel);
      });
    }
    this.route.queryParams.subscribe(params => {
      const conversationId = params['conversationId'];
      this.chargerConversations(conversationId ? Number(conversationId) : null);
    });
  }

  ngAfterViewChecked(): void {
    if (this.shouldScrollToBottom) {
      this.scrollToBottom();
      this.shouldScrollToBottom = false;
    }
  }

  // ════════════════════════════════════════
  //  CHARGEMENT
  // ════════════════════════════════════════

  chargerConversations(conversationIdToOpen: number | null = null): void {
    if (!this.utilisateurConnecte) return;

    const role = this.utilisateurConnecte.role;
    const id   = this.utilisateurConnecte.id;

    let url = '';
    if      (role === 'ETUDIANT')     url = `${this.API}/conversations/etudiant/${id}`;
    else if (role === 'PROPRIETAIRE') url = `${this.API}/conversations/proprietaire/${id}`;
    else { this.conversations = []; return; }

    this.http.get<any[]>(url).subscribe({
      next: (res) => {
        this.conversations = Array.isArray(res) ? res : [];
        this.normaliserConversations();
        this.chargerNonLusParConversation();

        if (conversationIdToOpen) {
          const conv = this.conversations.find(c => Number(c.id) === Number(conversationIdToOpen));
          if (conv) {
            conv.estActive
              ? this.ouvrirConversation(conv)
              : this.afficherConversationBloquee(conv);
          }
        }
      },
      error: () => { this.conversations = []; }
    });
  }

  normaliserConversations(): void {
    this.conversations = this.conversations.map(c => ({
      ...c,
      typeConversation:   c.typeConversation   || 'LOCATION',
      estActive:          c.estActive === true,
      dernierMessage:     c.dernierMessage     || null,
      dateDernierMessage: c.dateDernierMessage || null,
      scoreCompatibilite: c.scoreCompatibilite || null
    }));
  }

  chargerNonLusParConversation(): void {
    if (!this.utilisateurConnecte?.id || !this.conversations.length) return;
    for (const c of this.conversations) {
      this.http.get<any>(
        `${this.API}/messages/conversation/${c.id}/nonlus/count/${this.utilisateurConnecte.id}`
      ).subscribe({
        next:  (res) => { this.unreadByConversation[c.id] = res?.count || 0; },
        error: ()    => { this.unreadByConversation[c.id] = 0; }
      });
    }
  }

  // ════════════════════════════════════════
  //  FILTRES
  // ════════════════════════════════════════

  get conversationsFiltrees(): any[] {
    let result = [...this.conversations];

    if (this.filtreActif === 'LOCATION')   result = result.filter(c => (c.typeConversation || 'LOCATION') === 'LOCATION');
    if (this.filtreActif === 'MATCHING')   result = result.filter(c => c.typeConversation === 'MATCHING');
    if (this.filtreActif === 'ACTIVES')    result = result.filter(c => c.estActive === true);
    if (this.filtreActif === 'EN_ATTENTE') result = result.filter(c => !c.estActive);
    if (this.filtreActif === 'NON_LUS')    result = result.filter(c => (this.unreadByConversation[c.id] || 0) > 0);

    const q = this.rechercheConversation.trim().toLowerCase();
    if (q) result = result.filter(c =>
      this.getNomAffiche(c).toLowerCase().includes(q) ||
      this.getSousTitreConversation(c).toLowerCase().includes(q) ||
      this.getDernierMessage(c).toLowerCase().includes(q)
    );

    return result;
  }

  // ════════════════════════════════════════
  //  CONVERSATIONS
  // ════════════════════════════════════════

  ouvrirConversation(conversation: any): void {
    if (!conversation.estActive) {
      this.afficherConversationBloquee(conversation);
      return;
    }
    this.detailsOuvert = false;

    this.conversationSelectionnee = conversation;
    this.messages = [];
    this.chargementMessages = true;

    this.http.get<any[]>(`${this.API}/messages/conversation/${conversation.id}`).subscribe({
      next: (res) => {
        this.messages = (Array.isArray(res) ? res : []).map(m => ({
          ...m, typeMessage: m.typeMessage || 'NORMAL'
        }));
        this.chargementMessages = false;
        this.shouldScrollToBottom = true;
        if (this.utilisateurConnecte?.id) {
          this.marquerMessagesCommeLus(conversation.id);
        }
      },
      error: () => { this.messages = []; this.chargementMessages = false; }
    });
  }

  afficherConversationBloquee(conversation: any): void {
    this.conversationSelectionnee = conversation;
    this.messages = [];
  }

  // ════════════════════════════════════════
  //  MESSAGES
  // ════════════════════════════════════════
  envoyerMessage(): void {
    if (!this.conversationSelectionnee) return;
    if (!this.conversationSelectionnee.estActive) return;

    // Conversation bloquée : on n’envoie rien, sans alert
    if (this.conversationBloquee()) {
      return;
    }

    const contenu = this.nouveauMessage?.trim() || '';

    if (!contenu && !this.fichierSelectionne) {
      return;
    }

    const formData = new FormData();
    formData.append('conversationId', String(this.conversationSelectionnee.id));
    formData.append('expediteurId', String(this.utilisateurConnecte.id));
    formData.append('contenu', contenu);

    if (this.fichierSelectionne) {
      formData.append('fichier', this.fichierSelectionne);
    }

    this.http.post(`${this.API}/messages/avec-piece`, formData).subscribe({
      next: () => {
        this.nouveauMessage = '';
        this.fichierSelectionne = null;
        this.previewImage = null;
        this.typePieceSelectionnee = null;
        this.menuPieceJointeOuvert = false;
        this.emojiOuvert = false;

        this.ouvrirConversation(this.conversationSelectionnee);
        this.chargerConversations();
      },
      error: (err: any) => {
        const message =
          typeof err?.error === 'string'
            ? err.error
            : err?.error?.message || 'Impossible d’envoyer le message.';

        // Ici on garde l’erreur serveur seulement pour les vrais bugs
        console.error(message);
      }
    });
  }

  marquerMessagesCommeLus(conversationId: number): void {
    if (!this.utilisateurConnecte?.id) return;
    this.http.put(
      `${this.API}/messages/conversation/${conversationId}/lus/${this.utilisateurConnecte.id}`, {}
    ).subscribe({
      next:  () => { this.unreadByConversation[conversationId] = 0; },
      error: () => {}
    });
  }

  private scrollToBottom(): void {
    try {
      const el = this.messagesContainer?.nativeElement;
      if (el) el.scrollTop = el.scrollHeight;
    } catch {}
  }

  // Redimensionne le textarea automatiquement
  autoResize(event: Event): void {
    const textarea = event.target as HTMLTextAreaElement;
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 100) + 'px';
  }

  // ════════════════════════════════════════
  //  HELPERS AFFICHAGE
  // ════════════════════════════════════════

  getNomAffiche(conversation: any): string {
    if (!this.utilisateurConnecte || !conversation) return '';
    const type = conversation.typeConversation || 'LOCATION';
    if (type === 'MATCHING')
      return `${conversation.interlocuteurEtudiantPrenom || ''} ${conversation.interlocuteurEtudiantNom || ''}`.trim()
        || `${conversation.etudiantPrenom || ''} ${conversation.etudiantNom || ''}`.trim()
        || 'Étudiant';
    if (type === 'LOCATION')
      return this.utilisateurConnecte.role === 'ETUDIANT'
        ? `${conversation.proprietairePrenom || ''} ${conversation.proprietaireNom || ''}`.trim() || 'Propriétaire'
        : `${conversation.etudiantPrenom || ''} ${conversation.etudiantNom || ''}`.trim() || 'Étudiant';
    return 'Utilisateur';
  }

  getRoleInterlocuteur(conversation: any): string {
    if (!this.utilisateurConnecte || !conversation) return 'Utilisateur';
    const type = conversation.typeConversation || 'LOCATION';
    if (type === 'MATCHING') return 'Étudiant';
    if (type === 'LOCATION') return this.utilisateurConnecte.role === 'ETUDIANT' ? 'Propriétaire' : 'Étudiant';
    return 'Utilisateur';
  }

  getSousTitreConversation(conversation: any): string {
    if (!conversation) return '';
    const type = conversation.typeConversation || 'LOCATION';
    if (type === 'MATCHING') return `Profil compatible · ${conversation.scoreCompatibilite || 0}%`;
    if (type === 'LOCATION') return conversation.titreAnnonce || 'Annonce Locavia';
    return 'Conversation Locavia';
  }

  getDernierMessage(conversation: any): string {
    if (!conversation) return '';

    if (!conversation.estActive) {
      return 'En attente de confirmation';
    }

    return conversation.dernierMessage || 'Aucun message pour le moment';
  }

  getInitiales(nomComplet: string): string {
    if (!nomComplet) return '?';
    return nomComplet.split(' ').filter(Boolean).map((p: string) => p[0]).join('').slice(0, 2).toUpperCase();
  }

  getTotalNonLus(): number {
    return Object.values(this.unreadByConversation).reduce((t, c) => t + Number(c || 0), 0);
  }

  /**
   * Retourne l'URL de la photo de profil de l'interlocuteur si elle existe.
   * Cherche dans les champs courants renvoyés par le backend :
   * photoUrl, photoProfil, photo, avatarUrl, photoProprietaire, photoEtudiant
   */
  getPhotoUrl(conversation: any): string | null {
    if (!conversation) return null;
    const type = conversation.typeConversation || 'LOCATION';
    let url: string | null = null;

    if (type === 'LOCATION') {
      if (this.utilisateurConnecte?.role === 'ETUDIANT') {
        url = conversation.photoProprietaire
          || conversation.proprietairePhoto
          || conversation.proprietairePhotoUrl
          || null;
      } else {
        url = conversation.photoEtudiant
          || conversation.etudiantPhoto
          || conversation.etudiantPhotoUrl
          || null;
      }
    } else if (type === 'MATCHING') {
      url = conversation.photoEtudiant
        || conversation.interlocuteurPhoto
        || conversation.interlocuteurPhotoUrl
        || null;
    }

    // Fallback générique si le backend utilise un autre nom de champ
    if (!url) {
      url = conversation.photoUrl
        || conversation.photoProfil
        || conversation.photo
        || conversation.avatarUrl
        || null;
    }

    return url || null;
  }

  trackById(index: number, item: any): number { return item.id; }
  trackByMsgId(index: number, item: any): number { return item.id; }

  // emogiesss //
  emojiOuvert = false;

  toggleEmoji(): void {
    this.emojiOuvert = !this.emojiOuvert;
  }

  ajouterEmoji(event: any): void {
    const emoji = event?.emoji?.native || '';
    this.nouveauMessage = (this.nouveauMessage || '') + emoji;
  }

  // piece jointe //

  menuPieceJointeOuvert = false;

  fichierSelectionne: File | null = null;
  previewImage: string | null = null;
  typePieceSelectionnee: 'IMAGE' | 'FICHIER' | null = null;

  toggleMenuPieceJointe(): void {
    this.menuPieceJointeOuvert = !this.menuPieceJointeOuvert;
    this.emojiOuvert = false;
  }

  ouvrirSelectImage(input: HTMLInputElement): void {
    this.typePieceSelectionnee = 'IMAGE';
    this.menuPieceJointeOuvert = false;
    input.click();
  }

  ouvrirSelectFichier(input: HTMLInputElement): void {
    this.typePieceSelectionnee = 'FICHIER';
    this.menuPieceJointeOuvert = false;
    input.click();
  }

  onImageSelectionnee(event: Event): void {
    const input = event.target as HTMLInputElement;

    if (!input.files || input.files.length === 0) {
      return;
    }

    const fichier = input.files[0];

    if (!fichier.type.startsWith('image/')) {
      alert('Veuillez choisir une image.');
      input.value = '';
      return;
    }

    this.fichierSelectionne = fichier;
    this.typePieceSelectionnee = 'IMAGE';

    const reader = new FileReader();
    reader.onload = () => {
      this.previewImage = reader.result as string;
    };
    reader.readAsDataURL(fichier);
  }

  onFichierSelectionne(event: Event): void {
    const input = event.target as HTMLInputElement;

    if (!input.files || input.files.length === 0) {
      return;
    }

    const fichier = input.files[0];

    this.fichierSelectionne = fichier;
    this.typePieceSelectionnee = 'FICHIER';
    this.previewImage = null;
  }

  retirerFichier(): void {
    this.fichierSelectionne = null;
    this.previewImage = null;
    this.typePieceSelectionnee = null;
  }

  estImage(message: any): boolean {
    return message?.pieceJointeType === 'IMAGE' && !!message?.pieceJointeUrl;
  }

  estFichier(message: any): boolean {
    return message?.pieceJointeType === 'FICHIER' && !!message?.pieceJointeUrl;
  }

// appel vocall//
  appelVocalOuvert = false;
  appelEntrantOuvert = false;
  appelSortantOuvert = false;

  appelVocalUrl: SafeResourceUrl | null = null;

  appelCourant: AppelMessage | null = null;
  conversationAppel: any = null;
  demarrerAppelVocal(conversation: any): void {
    if (!conversation) return;

    if (!conversation.estActive) {
      alert('La conversation doit être active pour démarrer un appel.');
      return;
    }

    if (!this.utilisateurConnecte?.id) {
      alert('Utilisateur connecté introuvable.');
      return;
    }

    const destinataireId = this.getDestinataireAppelId(conversation);

    if (!destinataireId) {
      alert('Destinataire introuvable pour cet appel.');
      return;
    }

    const roomName = `Locavia-Audio-Conversation-${conversation.id}`;

    this.conversationAppel = conversation;

    this.appelCourant = {
      type: 'APPEL_ENTRANT',
      conversationId: conversation.id,
      appelantId: this.utilisateurConnecte.id,
      appelantNom: this.utilisateurConnecte.nom,
      appelantPrenom: this.utilisateurConnecte.prenom,
      destinataireId,
      roomName,
      message: 'Appel vocal sortant'
    };

    this.appelSortantOuvert = true;

    this.appelService.demarrerAppel({
      conversationId: conversation.id,
      appelantId: this.utilisateurConnecte.id
    });
  }

  gererEvenementAppel(appel: AppelMessage): void {
    if (!appel) return;

    if (appel.type === 'APPEL_ENTRANT') {
      this.appelCourant = appel;
      this.appelEntrantOuvert = true;
      this.appelSortantOuvert = false;

      this.demarrerSonnerie();

      return;
    }

    if (appel.type === 'APPEL_ACCEPTE') {
      this.appelCourant = appel;
      this.appelEntrantOuvert = false;
      this.appelSortantOuvert = false;
      this.ouvrirFenetreJitsi(appel.roomName);
      return;
    }

    if (appel.type === 'APPEL_REFUSE') {
      this.appelSortantOuvert = false;
      this.appelEntrantOuvert = false;
      alert('Appel refusé.');
      this.appelCourant = null;
      return;
    }

    if (appel.type === 'APPEL_TERMINE') {
      this.fermerAppelVocalLocal();
      alert('Appel terminé.');
    }
  }

  accepterAppel(): void {
    if (!this.appelCourant) return;
    this.arreterSonnerie();

    this.appelService.accepterAppel({
      conversationId: this.appelCourant.conversationId,
      appelantId: this.appelCourant.appelantId,
      destinataireId: this.appelCourant.destinataireId,
      roomName: this.appelCourant.roomName
    });

    this.appelEntrantOuvert = false;
    this.ouvrirFenetreJitsi(this.appelCourant.roomName);
  }

  refuserAppel(): void {
    if (!this.appelCourant) return;
    this.arreterSonnerie();
    this.appelService.refuserAppel({
      conversationId: this.appelCourant.conversationId,
      appelantId: this.appelCourant.appelantId,
      destinataireId: this.appelCourant.destinataireId,
      roomName: this.appelCourant.roomName
    });

    this.appelEntrantOuvert = false;
    this.appelCourant = null;
  }


  fermerAppelVocalLocal(): void {
    this.arreterSonnerie();
    this.appelVocalOuvert = false;
    this.appelEntrantOuvert = false;
    this.appelSortantOuvert = false;
    this.appelVocalUrl = null;
    this.appelCourant = null;
    this.conversationAppel = null;
  }

  ouvrirFenetreJitsi(roomName: string): void {
    if (!roomName) return;

    const nomUtilisateur = this.utilisateurConnecte
      ? `${this.utilisateurConnecte.prenom || ''} ${this.utilisateurConnecte.nom || ''}`.trim()
      : 'Utilisateur Locavia';

    const url =
      `https://meet.jit.si/${encodeURIComponent(roomName)}` +
      `#userInfo.displayName="${encodeURIComponent(nomUtilisateur)}"` +
      `&config.startWithVideoMuted=true` +
      `&config.prejoinPageEnabled=false` +
      `&config.disableDeepLinking=true` +
      `&interfaceConfig.SHOW_JITSI_WATERMARK=false`;

    this.appelVocalUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);
    this.appelVocalOuvert = true;
  }

  getDestinataireAppelId(conversation: any): number | null {
    if (!conversation || !this.utilisateurConnecte) return null;

    if (this.utilisateurConnecte.role === 'ETUDIANT') {
      return conversation.proprietaireId || null;
    }

    if (this.utilisateurConnecte.role === 'PROPRIETAIRE') {
      return conversation.etudiantId || null;
    }

    return null;
  }

  getNomAppelant(): string {
    if (!this.appelCourant) return '';

    return `${this.appelCourant.appelantPrenom || ''} ${this.appelCourant.appelantNom || ''}`.trim()
      || 'Utilisateur Locavia';
  }


  //bouton detaill //
  detailsOuvert = false;


  voirAnnonce(conversation: any): void {
    if (!conversation) return;

    const annonceId =
      conversation.annonceId ||
      conversation.idAnnonce ||
      conversation.demandeLocation?.annonce?.idAnnonce ||
      conversation.demandeLocation?.annonce?.id;

    if (!annonceId) {
      alert("Impossible d'ouvrir l'annonce : identifiant introuvable.");
      return;
    }

    this.router.navigate(['/annonces', annonceId]);
  }
  toggleDetails(): void {
    this.detailsOuvert = !this.detailsOuvert;
  }


  private ringtoneAudio: HTMLAudioElement | null = null;
  demarrerSonnerie(): void {
    this.arreterSonnerie();

    this.ringtoneAudio = new Audio('assets/sounds/ringtone.mp3');
    this.ringtoneAudio.loop = true;
    this.ringtoneAudio.volume = 0.7;

    this.ringtoneAudio.play().catch((error) => {
      console.warn('Sonnerie bloquée par le navigateur:', error);
    });
  }

  arreterSonnerie(): void {
    if (this.ringtoneAudio) {
      this.ringtoneAudio.pause();
      this.ringtoneAudio.currentTime = 0;
      this.ringtoneAudio = null;
    }
  }

  annulerAppelSortant(event?: Event): void {
    event?.stopPropagation();

    if (!this.appelCourant) {
      this.fermerAppelVocalLocal();
      return;
    }

    const appel = { ...this.appelCourant };

    this.fermerAppelVocalLocal();

    this.appelService.terminerAppel({
      conversationId: appel.conversationId,
      appelantId: appel.appelantId,
      destinataireId: appel.destinataireId,
      roomName: appel.roomName,
      message: 'APPEL_VOCAL_MANQUE'
    });

    this.rechargerConversationApresAppel(appel.conversationId);
  }

  terminerAppelVocal(event?: Event): void {
    event?.stopPropagation();

    if (!this.appelCourant) {
      this.fermerAppelVocalLocal();
      return;
    }

    const appel = { ...this.appelCourant };

    const messageAppel = this.appelVocalOuvert
      ? 'APPEL_VOCAL_TERMINE'
      : 'APPEL_VOCAL_MANQUE';

    this.fermerAppelVocalLocal();

    this.appelService.terminerAppel({
      conversationId: appel.conversationId,
      appelantId: appel.appelantId,
      destinataireId: appel.destinataireId,
      roomName: appel.roomName,
      message: messageAppel
    });

    this.rechargerConversationApresAppel(appel.conversationId);
  }

  rechargerConversationApresAppel(conversationId: number): void {
    const conv = this.conversations.find(c => Number(c.id) === Number(conversationId));

    if (conv && this.conversationSelectionnee?.id === conversationId) {
      this.ouvrirConversation(conv);
    }

    this.chargerConversations();
  }


  estMessageAppel(message: any): boolean {
    return message?.contenu === 'APPEL_VOCAL_MANQUE'
      || message?.contenu === 'APPEL_VOCAL_TERMINE';
  }

  getTitreMessageAppel(message: any): string {
    if (message?.contenu === 'APPEL_VOCAL_MANQUE') {
      return 'Appel vocal manqué';
    }

    if (message?.contenu === 'APPEL_VOCAL_TERMINE') {
      return 'Appel vocal terminé';
    }

    return 'Appel vocal';
  }


  toggleMenuMessage(message: any, event: Event): void {
    event.stopPropagation();
    this.messageMenuOuvertId = this.messageMenuOuvertId === message.id ? null : message.id;
    this.reactionPickerMessageId = null;
  }
  peutModifierMessage(message: any): boolean {
    return message?.expediteurId === this.utilisateurConnecte?.id
      && !message?.supprime
      && message?.typeMessage !== 'SYSTEME'
      && !message?.pieceJointeUrl;
  }
  peutSupprimerMessage(message: any): boolean {
    return message?.expediteurId === this.utilisateurConnecte?.id
      && !message?.supprime
      && message?.typeMessage !== 'SYSTEME';
  }
  commencerEdition(message: any): void {
    this.messageEnEdition = message;
    this.contenuEdition = message.contenu || '';
    this.messageMenuOuvertId = null;
  }
  annulerEdition(): void {
    this.messageEnEdition = null;
    this.contenuEdition = '';
  }
  enregistrerEdition(): void {
    if (!this.messageEnEdition || !this.contenuEdition.trim()) return;

    const messageId = this.messageEnEdition.id;
    const utilisateurId = this.utilisateurConnecte.id;

    const params = new FormData();
    params.append('utilisateurId', String(utilisateurId));
    params.append('contenu', this.contenuEdition.trim());

    this.http.put(`${this.API}/messages/${messageId}/modifier`, params).subscribe({
      next: () => {
        this.messageEnEdition = null;
        this.contenuEdition = '';
        this.ouvrirConversation(this.conversationSelectionnee);
        this.chargerConversations();
      },
      error: (err) => {
        alert(err?.error?.message || 'Impossible de modifier le message.');
      }
    });
  }
  supprimerMessage(message: any): void {
    if (!confirm('Supprimer ce message ?')) return;

    this.http.delete(`${this.API}/messages/${message.id}?utilisateurId=${this.utilisateurConnecte.id}`).subscribe({
      next: () => {
        this.messageMenuOuvertId = null;
        this.ouvrirConversation(this.conversationSelectionnee);
        this.chargerConversations();
      },
      error: (err) => {
        alert(err?.error?.message || 'Impossible de supprimer le message.');
      }
    });
  }
  toggleReactions(message: any, event: Event): void {
    event.stopPropagation();
    this.reactionPickerMessageId = this.reactionPickerMessageId === message.id ? null : message.id;
    this.messageMenuOuvertId = null;
  }
  reagirMessage(message: any, emoji: string): void {
    this.http.put(`${this.API}/messages/${message.id}/reaction?emoji=${encodeURIComponent(emoji)}`, {}).subscribe({
      next: () => {
        this.reactionPickerMessageId = null;
        this.ouvrirConversation(this.conversationSelectionnee);
      },
      error: (err) => {
        alert(err?.error?.message || 'Impossible de réagir au message.');
      }
    });
  }
  retirerReaction(message: any): void {
    this.http.delete(`${this.API}/messages/${message.id}/reaction`).subscribe({
      next: () => {
        this.ouvrirConversation(this.conversationSelectionnee);
      }
    });
  }
  getDateMessageComplete(message: any): string {
    if (!message?.dateEnvoi) return '';
    return new Date(message.dateEnvoi).toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
  isSystemeCentre(message: any): boolean {
    return message?.typeMessage === 'SYSTEME' && !this.estMessageAppel(message);
  }

  getPhotoDetails(): string | null {
    if (!this.conversationSelectionnee || !this.utilisateurConnecte) return null;

    if (this.utilisateurConnecte.role === 'ETUDIANT') {
      return this.conversationSelectionnee.proprietairePhotoProfil || null;
    }

    return this.conversationSelectionnee.etudiantPhotoProfil || null;
  }

  getImageAnnonceDetails(): string | null {
    const image =
      this.conversationSelectionnee?.annonceImageUrl ||
      this.conversationSelectionnee?.imageAnnonce ||
      this.conversationSelectionnee?.photoAnnonce ||
      this.conversationSelectionnee?.photoLogement ||
      null;

    if (!image) return null;

    if (image.startsWith('http://') || image.startsWith('https://')) {
      return image;
    }

    if (image.startsWith('/uploads')) {
      return `http://192.168.1.175:30808${image}`;
    }

    return `http://192.168.1.175:30808/uploads/annonces/${image}`;
  }

  conversationBloquee(): boolean {
    return this.conversationSelectionnee?.bloque === true;
  }

  bloqueeParMoi(): boolean {
    return this.conversationSelectionnee?.bloqueParId === this.utilisateurConnecte?.id;
  }

  toggleBlocageConversation(): void {
    if (!this.conversationSelectionnee?.id || !this.utilisateurConnecte?.id) return;

    const conversationId = this.conversationSelectionnee.id;
    const utilisateurId = this.utilisateurConnecte.id;

    if (this.conversationBloquee()) {
      if (!this.bloqueeParMoi()) {
        alert('Cette conversation a été bloquée par l’autre utilisateur.');
        return;
      }

      this.http.put(`${this.API}/conversations/${conversationId}/debloquer?utilisateurId=${utilisateurId}`, {})
        .subscribe({
          next: (res: any) => {
            this.conversationSelectionnee = {
              ...this.conversationSelectionnee,
              ...res
            };
            this.chargerConversations();
          },
          error: (err) => {
            alert(err?.error?.message || 'Impossible de débloquer la conversation.');
          }
        });

      return;
    }

    if (!confirm('Bloquer cette conversation ? Vous ne pourrez plus échanger de messages.')) return;

    this.http.put(`${this.API}/conversations/${conversationId}/bloquer?utilisateurId=${utilisateurId}`, {})
      .subscribe({
        next: (res: any) => {
          this.conversationSelectionnee = {
            ...this.conversationSelectionnee,
            ...res
          };
          this.chargerConversations();
        },
        error: (err) => {
          alert(err?.error?.message || 'Impossible de bloquer la conversation.');
        }
      });
  }

  detailsSectionOuverte: 'MEDIAS' | 'FICHIERS' | null = null;
  mediaPreviewOuvert = false;
  mediaPreviewUrl: string | null = null;
  mediaPreviewNom: string | null = null;

  toggleSectionDetails(section: 'MEDIAS' | 'FICHIERS'): void {
    this.detailsSectionOuverte =
      this.detailsSectionOuverte === section ? null : section;
  }

  getMediasConversation(): any[] {
    return (this.messages || []).filter((m: any) =>
      m.pieceJointeType === 'IMAGE' && m.pieceJointeUrl
    );
  }

  getFichiersConversation(): any[] {
    return (this.messages || []).filter((m: any) =>
      m.pieceJointeType === 'FICHIER' && m.pieceJointeUrl
    );
  }

  ouvrirApercuMedia(media: any): void {
    if (!media?.pieceJointeUrl) return;

    this.mediaPreviewUrl = media.pieceJointeUrl;
    this.mediaPreviewNom = media.pieceJointeNom || 'Image';
    this.mediaPreviewOuvert = true;
  }

  fermerApercuMedia(): void {
    this.mediaPreviewOuvert = false;
    this.mediaPreviewUrl = null;
    this.mediaPreviewNom = null;
  }

  ouvrirFichier(fichier: any): void {
    if (!fichier?.pieceJointeUrl) return;
    window.open(fichier.pieceJointeUrl, '_blank');
  }
}
