import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'typeLogement',
  standalone: true
})
export class TypeLogementPipe implements PipeTransform {
  private readonly map: Record<string, string> = {
    STUDIO: 'Studio',
    APPARTEMENT: 'Appartement',
    MAISON: 'Maison',
    COLOCATION: 'Colocation',
    CHAMBRE_SEULE: 'Chambre'
  };

  transform(value: string): string {
    return this.map[value] || value;
  }
}
