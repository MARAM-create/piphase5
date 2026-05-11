import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-verification',
  standalone: true,
  imports: [CommonModule, RouterModule, HttpClientModule], // ← ajout
  templateUrl: './verification.component.html',
  styleUrls: ['./verification.component.css']
})
export class VerificationComponent implements OnInit {
  chargement = true;
  resultat: any = null;
  erreur = '';
  numero = '';

  constructor(
    private route: ActivatedRoute,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    this.numero = this.route.snapshot.paramMap.get('numero') || '';

    // 👇 Logs de diagnostic — à supprimer après
    console.log('Numéro:', this.numero);
    console.log('URL:', `${environment.apiUrl}/api/verification/recu/${this.numero}`);

    if (!this.numero) {
      this.erreur = 'Numéro de reçu manquant dans l\'URL';
      this.chargement = false;
      return;
    }

    this.http.get(`${environment.apiUrl}/api/verification/recu/${this.numero}`)
      .subscribe({
        next: (data) => {
          console.log('Réponse backend:', data); // ← voir la structure exacte
          this.resultat = data;
          this.chargement = false;
        },
        error: (err) => {
          console.error('Erreur:', err.status, err.message);
          this.erreur = `Erreur ${err.status} — vérification impossible`;
          this.chargement = false;
        }
      });
  }
}
