// src/app/core/models/appel.model.ts

export type StatutAppel =
  | 'INACTIF'
  | 'APPEL_SORTANT'
  | 'APPEL_ENTRANT'
  | 'EN_COURS'
  | 'TERMINE';

export interface SignalMessage {
  type: 'offer' | 'answer' | 'candidate'
    | 'call-request' | 'call-accepted'
    | 'call-rejected' | 'call-ended';
  from: string;
  to: string;
  fromNom: string;
  data?: any;
}
