import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'prixFormat',
  standalone: true
})
export class PrixFormatPipe implements PipeTransform {
  transform(value: number, suffix: string = ' /mois'): string {
    if (value == null) return `0 TND${suffix}`;
    return `${value.toLocaleString('fr-FR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    })} TND${suffix}`;
  }
}
