import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { PickerComponent } from '@ctrl/ngx-emoji-mart';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { AppelMessage, AppelMessagerieService } from '../../core/services/appelmessagerie.service';

type FiltreMiniMessenger = 'TOUT' | 'NON_LUS' | 'MATCHING' | 'EN_ATTENTE';

@Component({
  selector: 'app-mini-messenger',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, PickerComponent],
  templateUrl: './mini-messenger.component.html',
  styleUrls: ['./mini-messenger.component.scss']
})
export class MiniMessengerComponent implements OnInit {

  @Input() panneauVisible = false;
  @Output() fermerPanneauNavbar = new EventEmitter<void>();

  private API = `${environment.apiUrl}/api`;

  utilisateurConnecte: any = null;

  conversations: any[] = [];
  recherche = '';
  filtreActif: FiltreMiniMessenger = 'TOUT';

  chargementConversations = false;
  unreadByConversation: { [key: number]: number } = {};

  chatsOuverts: any[] = [];
  chatsReduits: any[] = [];

  messagesParConversation: { [conversationId: number]: any[] } = {};
  nouveauMessageParConversation: { [conversationId: number]: string } = {};
  chargementMessagesParConversation: { [conversationId: number]: boolean } = {};

  emojiOuvertParConversation: { [conversationId: number]: boolean } = {};

  menuPieceJointeOuvertParConversation: { [conversationId: number]: boolean } = {};
  fichierSelectionneParConversation: { [conversationId: number]: File | null } = {};
  previewImageParConversation: { [conversationId: number]: string | null } = {};
  typePieceSelectionneeParConversation: { [conversationId: number]: 'IMAGE' | 'FICHIER' | null } = {};

  appelVocalOuvert = false;
  appelEntrantOuvert = false;
  appelSortantOuvert = false;

  appelVocalUrl: SafeResourceUrl | null = null;
  appelCourant: AppelMessage | null = null;
  conversationAppel: any = null;

  private ringtoneAudio: HTMLAudioElement | null = null;
  messageMenuOuvertId: number | null = null;
  messageEnEdition: any = null;
  contenuEdition = '';
  reactionPickerMessageId: number | null = null;

  reactionsRapides = ['❤️', '😂', '😮', '😢', '👍', '🙏'];
  constructor(
    private http: HttpClient,
    private router: Router,
    private sanitizer: DomSanitizer,
    private appelService: AppelMessagerieService
  ) {}

  ngOnInit(): void {
    const raw = localStorage.getItem('utilisateur');

    if (!raw) {
      console.warn('Aucun utilisateur connecté trouvé.');
      return;
    }

    this.utilisateurConnecte = JSON.parse(raw);

    if (this.utilisateurConnecte?.id) {
      this.appelService.connecter(this.utilisateurConnecte.id);

      this.appelService.appelRecu$.subscribe((appel: AppelMessage) => {
        this.gererEvenementAppel(appel);
      });
    }

    this.chargerConversations();
  }

  chargerConversations(): void {
    if (!this.utilisateurConnecte) return;

    const role = this.utilisateurConnecte.role;
    const id = this.utilisateurConnecte.id;

    let url = '';

    if (role === 'ETUDIANT') {
      url = `${this.API}/conversations/etudiant/${id}`;
    } else if (role === 'PROPRIETAIRE') {
      url = `${this.API}/conversations/proprietaire/${id}`;
    } else {
      console.warn('Rôle non géré pour mini messenger:', role);
      this.conversations = [];
      return;
    }

    this.chargementConversations = true;

    this.http.get<any[]>(url).subscribe({
      next: (res) => {
        this.conversations = Array.isArray(res) ? res : [];
        this.normaliserConversations();
        this.chargerNonLusParConversation();
        this.chargementConversations = false;
      },
      error: (err) => {
        console.error('Erreur chargement conversations mini messenger', err);
        this.conversations = [];
        this.chargementConversations = false;
      }
    });
  }

  normaliserConversations(): void {
    this.conversations = this.conversations.map(c => ({
      ...c,
      typeConversation: c.typeConversation || 'LOCATION',
      estActive: c.estActive === true,
      dernierMessage: c.dernierMessage || null,
      dateDernierMessage: c.dateDernierMessage || null,
      scoreCompatibilite: c.scoreCompatibilite || null
    }));
  }

  chargerNonLusParConversation(): void {
    if (!this.utilisateurConnecte?.id || !this.conversations.length) return;

    for (const conversation of this.conversations) {
      this.http.get<any>(
        `${this.API}/messages/conversation/${conversation.id}/nonlus/count/${this.utilisateurConnecte.id}`
      ).subscribe({
        next: (res) => {
          this.unreadByConversation[conversation.id] = res?.count || 0;
        },
        error: (err) => {
          console.error('Erreur count non lus mini messenger', err);
          this.unreadByConversation[conversation.id] = 0;
        }
      });
    }
  }

  get conversationsFiltrees(): any[] {
    let result = [...this.conversations];

    if (this.filtreActif === 'NON_LUS') {
      result = result.filter(c => (this.unreadByConversation[c.id] || 0) > 0);
    }

    if (this.filtreActif === 'MATCHING') {
      result = result.filter(c => c.typeConversation === 'MATCHING');
    }

    if (this.filtreActif === 'EN_ATTENTE') {
      result = result.filter(c => !c.estActive);
    }

    const q = this.recherche.trim().toLowerCase();

    if (q) {
      result = result.filter(c =>
        this.getNomAffiche(c).toLowerCase().includes(q) ||
        this.getSousTitreConversation(c).toLowerCase().includes(q) ||
        this.getDernierMessage(c).toLowerCase().includes(q)
      );
    }

    return result;
  }

  ouvrirMiniChat(conversation: any): void {
    if (!conversation) return;

    const dejaOuvert = this.chatsOuverts.some(c => c.id === conversation.id);

    if (!dejaOuvert) {
      this.chatsOuverts.push(conversation);
    }

    if (this.nouveauMessageParConversation[conversation.id] === undefined) {
      this.nouveauMessageParConversation[conversation.id] = '';
    }

    this.fermerPanneauNavbar.emit();
    this.chargerMessagesConversation(conversation);
  }

  chargerMessagesConversation(conversation: any): void {
    if (!conversation?.id) return;

    if (!conversation.estActive) {
      this.messagesParConversation[conversation.id] = [];
      this.chargementMessagesParConversation[conversation.id] = false;
      return;
    }

    this.chargementMessagesParConversation[conversation.id] = true;

    this.http.get<any[]>(`${this.API}/messages/conversation/${conversation.id}`).subscribe({
      next: (res) => {
        this.messagesParConversation[conversation.id] = Array.isArray(res)
          ? res.map(m => ({
            ...m,
            typeMessage: m.typeMessage || 'NORMAL'
          }))
          : [];

        this.marquerMessagesCommeLus(conversation.id);
        this.chargementMessagesParConversation[conversation.id] = false;
      },
      error: (err) => {
        console.error('Erreur chargement messages mini chat', err);
        this.messagesParConversation[conversation.id] = [];
        this.chargementMessagesParConversation[conversation.id] = false;
      }
    });
  }

  envoyerMessage(conversation: any): void {
    if (!conversation) return;
    if (!conversation.estActive) return;

    const contenu = this.nouveauMessageParConversation[conversation.id]?.trim() || '';
    const fichier = this.fichierSelectionneParConversation[conversation.id];

    if (!contenu && !fichier) return;

    const formData = new FormData();
    formData.append('conversationId', String(conversation.id));
    formData.append('expediteurId', String(this.utilisateurConnecte.id));
    formData.append('contenu', contenu);

    if (fichier) {
      formData.append('fichier', fichier);
    }

    this.http.post(`${this.API}/messages/avec-piece`, formData).subscribe({
      next: () => {
        this.nouveauMessageParConversation[conversation.id] = '';

        this.fichierSelectionneParConversation[conversation.id] = null;
        this.previewImageParConversation[conversation.id] = null;
        this.typePieceSelectionneeParConversation[conversation.id] = null;
        this.menuPieceJointeOuvertParConversation[conversation.id] = false;
        this.emojiOuvertParConversation[conversation.id] = false;

        this.chargerMessagesConversation(conversation);
        this.chargerConversations();
      },
      error: (err: any) => {
        const message =
          typeof err?.error === 'string'
            ? err.error
            : err?.error?.message || 'Impossible d’envoyer le message.';

        alert(message);
      }
    });
  }

  marquerMessagesCommeLus(conversationId: number): void {
    if (!this.utilisateurConnecte?.id) return;

    this.http.put(
      `${this.API}/messages/conversation/${conversationId}/lus/${this.utilisateurConnecte.id}`,
      {}
    ).subscribe({
      next: () => {
        this.unreadByConversation[conversationId] = 0;
      },
      error: (err) => {
        console.error('Erreur marquage messages lus mini messenger', err);
      }
    });
  }

  fermerPanneau(): void {
    this.fermerPanneauNavbar.emit();
  }

  allerVersMessagerieComplete(): void {
    this.fermerPanneauNavbar.emit();
    this.router.navigate(['/messagerie']);
  }

  ouvrirDansMessagerieComplete(conversation: any): void {
    this.fermerPanneauNavbar.emit();

    this.router.navigate(['/messagerie'], {
      queryParams: {
        conversationId: conversation.id
      }
    });
  }

  isConversationOuverte(conversation: any): boolean {
    if (!conversation) return false;
    return this.chatsOuverts.some(c => c.id === conversation.id);
  }

  getNomAffiche(conversation: any): string {
    if (!this.utilisateurConnecte || !conversation) return '';

    const type = conversation.typeConversation || 'LOCATION';

    if (type === 'MATCHING') {
      return `${conversation.interlocuteurEtudiantPrenom || ''} ${conversation.interlocuteurEtudiantNom || ''}`.trim()
        || `${conversation.etudiantPrenom || ''} ${conversation.etudiantNom || ''}`.trim()
        || 'Étudiant';
    }

    if (type === 'LOCATION') {
      if (this.utilisateurConnecte.role === 'ETUDIANT') {
        return `${conversation.proprietairePrenom || ''} ${conversation.proprietaireNom || ''}`.trim()
          || 'Propriétaire';
      }

      return `${conversation.etudiantPrenom || ''} ${conversation.etudiantNom || ''}`.trim()
        || 'Étudiant';
    }

    return 'Utilisateur';
  }

  getRoleInterlocuteur(conversation: any): string {
    if (!this.utilisateurConnecte || !conversation) return 'Utilisateur';

    const type = conversation.typeConversation || 'LOCATION';

    if (type === 'MATCHING') {
      return 'Étudiant';
    }

    if (type === 'LOCATION') {
      return this.utilisateurConnecte.role === 'ETUDIANT' ? 'Propriétaire' : 'Étudiant';
    }

    return 'Utilisateur';
  }

  getSousTitreConversation(conversation: any): string {
    if (!conversation) return '';

    const type = conversation.typeConversation || 'LOCATION';

    if (type === 'MATCHING') {
      return `Profil compatible · ${conversation.scoreCompatibilite || 0}%`;
    }

    if (type === 'LOCATION') {
      return `Logement : ${conversation.titreAnnonce || 'Annonce Locavia'}`;
    }

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

    return nomComplet
      .split(' ')
      .filter(Boolean)
      .map((p: string) => p[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  }

  getTotalNonLus(): number {
    return Object.values(this.unreadByConversation)
      .reduce((total, current) => total + Number(current || 0), 0);
  }

  trackByConversationId(index: number, conversation: any): number {
    return conversation?.id ?? index;
  }

  trackByMessageId(index: number, message: any): number {
    return message?.id ?? index;
  }

  reduireMiniChat(conversation: any): void {
    if (!conversation) return;

    this.chatsOuverts = this.chatsOuverts.filter(c => c.id !== conversation.id);

    const existeDeja = this.chatsReduits.some(c => c.id === conversation.id);

    if (!existeDeja) {
      this.chatsReduits.push(conversation);
    }
  }

  restaurerMiniChat(conversation: any): void {
    if (!conversation) return;

    const dejaOuvert = this.chatsOuverts.some(c => c.id === conversation.id);

    if (!dejaOuvert) {
      this.chatsOuverts.push(conversation);
    }

    if (this.nouveauMessageParConversation[conversation.id] === undefined) {
      this.nouveauMessageParConversation[conversation.id] = '';
    }

    if (!this.messagesParConversation[conversation.id]) {
      this.chargerMessagesConversation(conversation);
    }
  }

  fermerMiniChat(conversation: any): void {
    if (!conversation) return;

    this.chatsOuverts = this.chatsOuverts.filter(c => c.id !== conversation.id);
  }

  fermerBulle(conversation: any, event: Event): void {
    event.stopPropagation();

    this.chatsReduits = this.chatsReduits.filter(c => c.id !== conversation.id);
    this.chatsOuverts = this.chatsOuverts.filter(c => c.id !== conversation.id);

    delete this.messagesParConversation[conversation.id];
    delete this.nouveauMessageParConversation[conversation.id];
    delete this.chargementMessagesParConversation[conversation.id];

    delete this.emojiOuvertParConversation[conversation.id];
    delete this.menuPieceJointeOuvertParConversation[conversation.id];
    delete this.fichierSelectionneParConversation[conversation.id];
    delete this.previewImageParConversation[conversation.id];
    delete this.typePieceSelectionneeParConversation[conversation.id];
  }

  getPhotoAffiche(conversation: any): string | null {
    if (!this.utilisateurConnecte || !conversation) return null;

    const type = conversation.typeConversation || 'LOCATION';

    if (type === 'MATCHING') {
      return conversation.interlocuteurEtudiantPhotoProfil
        || conversation.etudiantPhotoProfil
        || null;
    }

    if (type === 'LOCATION') {
      if (this.utilisateurConnecte.role === 'ETUDIANT') {
        return conversation.proprietairePhotoProfil || null;
      }

      return conversation.etudiantPhotoProfil || null;
    }

    return null;
  }

  toggleEmoji(conversation: any): void {
    if (!conversation) return;

    const id = conversation.id;
    this.emojiOuvertParConversation[id] = !this.emojiOuvertParConversation[id];
    this.menuPieceJointeOuvertParConversation[id] = false;
  }

  ajouterEmoji(event: any, conversation: any): void {
    if (!conversation) return;

    const emoji = event?.emoji?.native || '';

    this.nouveauMessageParConversation[conversation.id] =
      (this.nouveauMessageParConversation[conversation.id] || '') + emoji;
  }

  toggleMenuPieceJointe(conversation: any): void {
    if (!conversation) return;

    const id = conversation.id;
    this.menuPieceJointeOuvertParConversation[id] = !this.menuPieceJointeOuvertParConversation[id];
    this.emojiOuvertParConversation[id] = false;
  }

  ouvrirSelectImage(input: HTMLInputElement, conversation: any): void {
    if (!conversation) return;

    this.typePieceSelectionneeParConversation[conversation.id] = 'IMAGE';
    this.menuPieceJointeOuvertParConversation[conversation.id] = false;
    input.click();
  }

  ouvrirSelectFichier(input: HTMLInputElement, conversation: any): void {
    if (!conversation) return;

    this.typePieceSelectionneeParConversation[conversation.id] = 'FICHIER';
    this.menuPieceJointeOuvertParConversation[conversation.id] = false;
    input.click();
  }

  onImageSelectionnee(event: Event, conversation: any): void {
    if (!conversation) return;

    const input = event.target as HTMLInputElement;

    if (!input.files || input.files.length === 0) return;

    const fichier = input.files[0];

    if (!fichier.type.startsWith('image/')) {
      alert('Veuillez choisir une image.');
      input.value = '';
      return;
    }

    this.fichierSelectionneParConversation[conversation.id] = fichier;
    this.typePieceSelectionneeParConversation[conversation.id] = 'IMAGE';

    const reader = new FileReader();

    reader.onload = () => {
      this.previewImageParConversation[conversation.id] = reader.result as string;
    };

    reader.readAsDataURL(fichier);
  }

  onFichierSelectionne(event: Event, conversation: any): void {
    if (!conversation) return;

    const input = event.target as HTMLInputElement;

    if (!input.files || input.files.length === 0) return;

    const fichier = input.files[0];

    this.fichierSelectionneParConversation[conversation.id] = fichier;
    this.typePieceSelectionneeParConversation[conversation.id] = 'FICHIER';
    this.previewImageParConversation[conversation.id] = null;
  }

  retirerFichier(conversation: any): void {
    if (!conversation) return;

    this.fichierSelectionneParConversation[conversation.id] = null;
    this.previewImageParConversation[conversation.id] = null;
    this.typePieceSelectionneeParConversation[conversation.id] = null;
  }

  estImage(message: any): boolean {
    return message?.pieceJointeType === 'IMAGE' && !!message?.pieceJointeUrl;
  }

  estFichier(message: any): boolean {
    return message?.pieceJointeType === 'FICHIER' && !!message?.pieceJointeUrl;
  }

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
      this.fermerAppelVocalLocal();
      alert('Appel refusé.');
      return;
    }

    if (appel.type === 'APPEL_TERMINE') {
      this.fermerAppelVocalLocal();
      return;
    }
  }

  accepterAppel(event?: Event): void {
    event?.stopPropagation();

    if (!this.appelCourant) return;

    this.arreterSonnerie();

    const appel = { ...this.appelCourant };

    this.appelEntrantOuvert = false;
    this.appelSortantOuvert = false;

    this.appelService.accepterAppel({
      conversationId: appel.conversationId,
      appelantId: appel.appelantId,
      destinataireId: appel.destinataireId,
      roomName: appel.roomName
    });

    this.ouvrirFenetreJitsi(appel.roomName);
  }

  refuserAppel(event?: Event): void {
    event?.stopPropagation();

    if (!this.appelCourant) {
      this.fermerAppelVocalLocal();
      return;
    }

    this.arreterSonnerie();

    const appel = { ...this.appelCourant };

    this.fermerAppelVocalLocal();

    this.appelService.refuserAppel({
      conversationId: appel.conversationId,
      appelantId: appel.appelantId,
      destinataireId: appel.destinataireId,
      roomName: appel.roomName
    });
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

    if (conv) {
      this.chargerMessagesConversation(conv);
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

  enregistrerEdition(conversation: any): void {
    if (!this.messageEnEdition || !this.contenuEdition.trim()) return;

    const messageId = this.messageEnEdition.id;
    const utilisateurId = this.utilisateurConnecte.id;

    const formData = new FormData();
    formData.append('utilisateurId', String(utilisateurId));
    formData.append('contenu', this.contenuEdition.trim());

    this.http.put(`${this.API}/messages/${messageId}/modifier`, formData).subscribe({
      next: () => {
        this.messageEnEdition = null;
        this.contenuEdition = '';
        this.chargerMessagesConversation(conversation);
        this.chargerConversations();
      },
      error: (err) => {
        alert(err?.error?.message || 'Impossible de modifier le message.');
      }
    });
  }

  supprimerMessage(message: any, conversation: any): void {
    if (!confirm('Supprimer ce message ?')) return;

    this.http.delete(`${this.API}/messages/${message.id}?utilisateurId=${this.utilisateurConnecte.id}`).subscribe({
      next: () => {
        this.messageMenuOuvertId = null;
        this.chargerMessagesConversation(conversation);
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

  reagirMessage(message: any, emoji: string, conversation: any): void {
    this.http.put(`${this.API}/messages/${message.id}/reaction?emoji=${encodeURIComponent(emoji)}`, {}).subscribe({
      next: () => {
        this.reactionPickerMessageId = null;
        this.chargerMessagesConversation(conversation);
      },
      error: (err) => {
        alert(err?.error?.message || 'Impossible de réagir au message.');
      }
    });
  }

  retirerReaction(message: any, conversation: any): void {
    this.http.delete(`${this.API}/messages/${message.id}/reaction`).subscribe({
      next: () => {
        this.chargerMessagesConversation(conversation);
      },
      error: () => {}
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


}
