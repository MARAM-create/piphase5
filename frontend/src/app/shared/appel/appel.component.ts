import {
  Component, OnInit, OnDestroy,
  ViewChild, ElementRef, AfterViewInit
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppelService } from '../../core/services/appel.service';
import { SignalMessage, StatutAppel } from '../../core/models/appel.model';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-appel',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './appel.component.html',
  styleUrls: ['./appel.component.css']
})
export class AppelComponent implements OnInit, OnDestroy, AfterViewInit {

  @ViewChild('videoLocal')         videoLocal!:         ElementRef<HTMLVideoElement>;
  @ViewChild('videoRemote')        videoRemote!:        ElementRef<HTMLVideoElement>;
  @ViewChild('videoLocalFlottant') videoLocalFlottant!: ElementRef<HTMLVideoElement>;

  statut: StatutAppel = 'INACTIF';
  appelEntrant: SignalMessage | null = null;
  appelSortantVers = '';
  minuterie = '00:00';
  microCoupe = false;
  videoCoupee = false;
  minimise = false;

  private subs: Subscription[] = [];
  private intervalMinuterie?: any;
  private secondes = 0;

  constructor(public appelService: AppelService) {}

  ngOnInit(): void {
    this.subs.push(

      this.appelService.statut$.subscribe(s => {
        this.statut = s;
        if (s === 'EN_COURS') this.demarrerMinuterie();
        else {
          this.arreterMinuterie();
          this.appelService.maximiser();
        }
      }),

      this.appelService.appelEntrant$.subscribe(signal => {
        this.appelEntrant = signal;
      }),

      this.appelService.minimise$.subscribe(m => {
        this.minimise = m;
        setTimeout(() => this.rattacherStreams(), 100);
      }),

      this.appelService.localStream$.subscribe(() => {
        setTimeout(() => this.rattacherStreams(), 100);
      }),

      this.appelService.remoteStream$.subscribe(() => {
        setTimeout(() => this.rattacherStreams(), 100);
      })

    );
  }

  ngAfterViewInit(): void {
    setTimeout(() => this.rattacherStreams(), 100);
  }

  ngOnDestroy(): void {
    this.subs.forEach(s => s.unsubscribe());
    this.arreterMinuterie();
  }

  // ── Rattacher les streams aux éléments vidéo ─────────────────
  private rattacherStreams(): void {
    const local  = this.appelService.localStream$.value;
    const remote = this.appelService.remoteStream$.value;

    if (local) {
      if (this.videoLocal?.nativeElement)
        this.videoLocal.nativeElement.srcObject = local;
      if (this.videoLocalFlottant?.nativeElement)
        this.videoLocalFlottant.nativeElement.srcObject = local;
    }

    if (remote && this.videoRemote?.nativeElement)
      this.videoRemote.nativeElement.srcObject = remote;
  }

  async accepter(): Promise<void> {
    if (!this.appelEntrant) return;
    this.appelSortantVers = this.appelEntrant.from;
    await this.appelService.accepterAppel(this.appelEntrant);
    this.appelEntrant = null;
  }

  refuser(): void {
    if (!this.appelEntrant) return;
    this.appelService.refuserAppel(this.appelEntrant);
    this.appelEntrant = null;
  }

  terminer(): void {
    this.appelService.terminerAppel(this.appelSortantVers);
    this.appelSortantVers = '';
  }

  minimiser(): void { this.appelService.minimiser(); }
  maximiser(): void { this.appelService.maximiser(); }

  couperMicro(): void {
    this.microCoupe = !this.microCoupe;
    this.appelService.localStream$.value?.getAudioTracks()
      .forEach(t => t.enabled = !this.microCoupe);
  }

  couperVideo(): void {
    this.videoCoupee = !this.videoCoupee;
    this.appelService.localStream$.value?.getVideoTracks()
      .forEach(t => t.enabled = !this.videoCoupee);
  }

  private demarrerMinuterie(): void {
    this.secondes = 0;
    this.intervalMinuterie = setInterval(() => {
      this.secondes++;
      const m = Math.floor(this.secondes / 60).toString().padStart(2, '0');
      const s = (this.secondes % 60).toString().padStart(2, '0');
      this.minuterie = `${m}:${s}`;
    }, 1000);
  }

  private arreterMinuterie(): void {
    clearInterval(this.intervalMinuterie);
    this.minuterie = '00:00';
    this.secondes  = 0;
  }
}
