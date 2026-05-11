import { Injectable } from '@angular/core';
import { Client, StompSubscription } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { BehaviorSubject, Subject } from 'rxjs';
import { SignalMessage, StatutAppel } from '../models/appel.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AppelService {

  private client!: Client;
  private subscription?: StompSubscription;
  private peerConnection?: RTCPeerConnection;
  private localStream?: MediaStream;
  private audio?: HTMLAudioElement;

  statut$       = new BehaviorSubject<StatutAppel>('INACTIF');
  appelEntrant$ = new Subject<SignalMessage>();
  monEmail      = '';
  monNom        = '';

  localStream$  = new BehaviorSubject<MediaStream | null>(null);
  remoteStream$ = new BehaviorSubject<MediaStream | null>(null);
  minimise$     = new BehaviorSubject<boolean>(false);

  minimiser(): void { this.minimise$.next(true);  }
  maximiser(): void { this.minimise$.next(false); }

  private iceServers = [
    { urls: 'stun:stun.l.google.com:19302'  },
    { urls: 'stun:stun1.l.google.com:19302' }
  ];

  // ── Sonnerie ─────────────────────────────────────────────────────
  private jouerSonnerie(): void {
    this.audio = new Audio('/assets/sounds/sonnerie.mp3');
    this.audio.loop = true;
    this.audio.play().catch(() => {});
  }

  private arreterSonnerie(): void {
    this.audio?.pause();
    this.audio = undefined;
  }

  // ── Connexion WebSocket ──────────────────────────────────────────
  connecter(email: string, nom: string, token: string): void {
    this.monEmail = email;
    this.monNom   = nom;

    // Éviter double connexion
    if (this.client?.active) {
      console.log('WebSocket déjà connecté');
      return;
    }

    this.client = new Client({
      webSocketFactory: () =>
        new SockJS(`${environment.apiUrl}/ws`),
      connectHeaders: { Authorization: `Bearer ${token}` },
      reconnectDelay: 5000,
      onConnect: () => {
        console.log('✅ WebSocket appel connecté pour', email);
        this.ecouter();
      },
      onDisconnect: () => console.log('WebSocket appel déconnecté'),
      onStompError: (frame) => {
        console.error('Erreur STOMP :', frame);
      }
    });

    this.client.activate();
  }

  deconnecter(): void {
    this.subscription?.unsubscribe();
    this.client?.deactivate();
    this.terminerAppel();
  }

  // ── Écouter les messages entrants ───────────────────────────────
  private ecouter(): void {
    this.subscription = this.client.subscribe(
      '/user/queue/signal',
      async (message) => {
        const signal: SignalMessage = JSON.parse(message.body);
        await this.traiterSignal(signal);
      }
    );
  }

  // ── Traiter les signaux WebRTC ───────────────────────────────────
  private async traiterSignal(signal: SignalMessage): Promise<void> {
    switch (signal.type) {

      case 'call-request':
        this.jouerSonnerie();
        this.statut$.next('APPEL_ENTRANT');
        this.appelEntrant$.next(signal);
        break;

      case 'call-accepted':
        this.arreterSonnerie();
        await this.creerOffre(signal.from);
        break;

      case 'call-rejected':
        this.arreterSonnerie();
        this.statut$.next('INACTIF');
        this.nettoyerStream();
        alert(`${signal.fromNom} a refusé l'appel`);
        break;

      case 'call-ended':
        this.arreterSonnerie();
        this.terminerAppel();
        break;

      case 'offer':
        await this.traiterOffre(signal);
        break;

      case 'answer':
        await this.peerConnection?.setRemoteDescription(
          new RTCSessionDescription(signal.data)
        );
        break;

      case 'candidate':
        if (signal.data) {
          await this.peerConnection?.addIceCandidate(
            new RTCIceCandidate(signal.data)
          );
        }
        break;
    }
  }

  // ── Envoyer un signal — avec vérification connexion ─────────────
  private envoyer(signal: Partial<SignalMessage>): void {
    if (!this.client?.connected) {
      console.warn('⚠️ WebSocket non connecté — signal ignoré :', signal.type);
      return;
    }
    this.client.publish({
      destination: '/app/signal',
      body: JSON.stringify({
        ...signal,
        from:    this.monEmail,
        fromNom: this.monNom
      })
    });
  }

  // ── Attendre que le WebSocket soit connecté ──────────────────────
  private attendreConnexion(timeoutMs = 5000): Promise<boolean> {
    return new Promise(resolve => {
      if (this.client?.connected) {
        resolve(true);
        return;
      }

      const debut    = Date.now();
      const interval = setInterval(() => {
        if (this.client?.connected) {
          clearInterval(interval);
          resolve(true);
        } else if (Date.now() - debut > timeoutMs) {
          clearInterval(interval);
          resolve(false);
        }
      }, 200);
    });
  }

  // ── Initier un appel ─────────────────────────────────────────────
  async initierAppel(emailDestinataire: string): Promise<void> {
    this.statut$.next('APPEL_SORTANT');

    // Attendre connexion WebSocket
    const connecte = await this.attendreConnexion(5000);
    if (!connecte) {
      console.error('WebSocket non disponible');
      this.statut$.next('INACTIF');
      alert('Connexion au serveur impossible. Veuillez réessayer.');
      return;
    }

    await this.obtenirFluxLocal();
    this.envoyer({ type: 'call-request', to: emailDestinataire });
  }

  // ── Accepter un appel ────────────────────────────────────────────
  async accepterAppel(signal: SignalMessage): Promise<void> {
    this.arreterSonnerie();
    this.statut$.next('EN_COURS');
    await this.obtenirFluxLocal();
    this.envoyer({ type: 'call-accepted', to: signal.from });
  }

  // ── Refuser un appel ─────────────────────────────────────────────
  refuserAppel(signal: SignalMessage): void {
    this.arreterSonnerie();
    this.statut$.next('INACTIF');
    this.envoyer({ type: 'call-rejected', to: signal.from });
  }

  // ── Terminer l'appel ─────────────────────────────────────────────
  terminerAppel(emailDestinataire?: string): void {
    if (emailDestinataire) {
      this.envoyer({ type: 'call-ended', to: emailDestinataire });
    }
    this.arreterSonnerie();
    this.peerConnection?.close();
    this.peerConnection = undefined;
    this.nettoyerStream();
    this.statut$.next('INACTIF');
    this.remoteStream$.next(null);
  }

  // ── Créer une offre WebRTC ───────────────────────────────────────
  private async creerOffre(emailDestinataire: string): Promise<void> {
    this.statut$.next('EN_COURS');
    this.creerPeerConnection(emailDestinataire);

    const offer = await this.peerConnection!.createOffer({
      offerToReceiveAudio: true,
      offerToReceiveVideo: true
    });
    await this.peerConnection!.setLocalDescription(offer);
    this.envoyer({ type: 'offer', to: emailDestinataire, data: offer });
  }

  // ── Traiter une offre reçue ──────────────────────────────────────
  private async traiterOffre(signal: SignalMessage): Promise<void> {
    this.creerPeerConnection(signal.from);
    await this.peerConnection!.setRemoteDescription(
      new RTCSessionDescription(signal.data)
    );
    const answer = await this.peerConnection!.createAnswer();
    await this.peerConnection!.setLocalDescription(answer);
    this.envoyer({ type: 'answer', to: signal.from, data: answer });
  }

  // ── Créer PeerConnection ─────────────────────────────────────────
  private creerPeerConnection(emailDestinataire: string): void {
    this.peerConnection = new RTCPeerConnection({
      iceServers: this.iceServers
    });

    this.localStream?.getTracks().forEach(track => {
      this.peerConnection!.addTrack(track, this.localStream!);
    });

    this.peerConnection.ontrack = (event) => {
      this.remoteStream$.next(event.streams[0]);
    };

    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        this.envoyer({
          type: 'candidate',
          to:   emailDestinataire,
          data: event.candidate
        });
      }
    };

    this.peerConnection.onconnectionstatechange = () => {
      const state = this.peerConnection?.connectionState;
      console.log('État connexion WebRTC :', state);
      if (state === 'disconnected' || state === 'failed') {
        this.terminerAppel();
      }
    };
  }

  // ── Obtenir flux local ───────────────────────────────────────────
  private async obtenirFluxLocal(): Promise<void> {
    if (this.localStream) return;
    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: { width: 640, height: 480, facingMode: 'user' }
      });
    } catch {
      try {
        this.localStream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: false
        });
      } catch (e) {
        console.error('Impossible d\'accéder au micro/caméra :', e);
        throw e;
      }
    }
    this.localStream$.next(this.localStream);
  }

  // ── Nettoyer les streams ─────────────────────────────────────────
  private nettoyerStream(): void {
    this.localStream?.getTracks().forEach(t => t.stop());
    this.localStream = undefined;
    this.localStream$.next(null);
  }
}
