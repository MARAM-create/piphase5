import { Injectable } from '@angular/core';
import { Client, IMessage } from '@stomp/stompjs';
import { Subject } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface AppelMessage {
  type: 'APPEL_ENTRANT' | 'APPEL_ACCEPTE' | 'APPEL_REFUSE' | 'APPEL_TERMINE';

  conversationId: number;

  appelantId: number;
  appelantNom?: string;
  appelantPrenom?: string;

  destinataireId: number;
  destinataireNom?: string;
  destinatairePrenom?: string;

  roomName: string;
  message?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AppelMessagerieService {

  private stompClient: Client | null = null;
  private utilisateurId: number | null = null;

  appelRecu$ = new Subject<AppelMessage>();

  connecter(utilisateurId: number): void {
    if (!utilisateurId) return;

    this.utilisateurId = utilisateurId;

    if (this.stompClient?.active) {
      return;
    }

    const baseUrl = environment.apiUrl.replace('/api', '');
    const wsUrl = baseUrl.replace('http://', 'ws://').replace('https://', 'wss://');

    this.stompClient = new Client({
      brokerURL: `${wsUrl}/ws-locavia`,
      reconnectDelay: 5000,
      debug: () => {}
    });

    this.stompClient.onConnect = () => {
      console.log('WebSocket appel connecté pour utilisateur', utilisateurId);

      this.stompClient?.subscribe(`/topic/appels/${utilisateurId}`, (message: IMessage) => {
        const data: AppelMessage = JSON.parse(message.body);
        this.appelRecu$.next(data);
      });
    };

    this.stompClient.onStompError = (frame) => {
      console.error('Erreur STOMP', frame);
    };

    this.stompClient.onWebSocketError = (event) => {
      console.error('Erreur WebSocket', event);
    };

    this.stompClient.activate();
  }

  deconnecter(): void {
    if (this.stompClient) {
      this.stompClient.deactivate();
      this.stompClient = null;
    }
  }

  demarrerAppel(payload: Partial<AppelMessage>): void {
    this.envoyer('/app/appel/demarrer', payload);
  }

  accepterAppel(payload: Partial<AppelMessage>): void {
    this.envoyer('/app/appel/accepter', payload);
  }

  refuserAppel(payload: Partial<AppelMessage>): void {
    this.envoyer('/app/appel/refuser', payload);
  }

  terminerAppel(payload: Partial<AppelMessage>): void {
    this.envoyer('/app/appel/terminer', payload);
  }

  private envoyer(destination: string, payload: any): void {
    if (!this.stompClient || !this.stompClient.active) {
      console.error('WebSocket non connecté');
      return;
    }

    this.stompClient.publish({
      destination,
      body: JSON.stringify(payload)
    });
  }
}
