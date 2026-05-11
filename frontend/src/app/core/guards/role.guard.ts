import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { Role } from '../models/utilisateur.model';

export const roleGuard = (role: Role): CanActivateFn => () => {
  const auth   = inject(AuthService);
  const router = inject(Router);
  if (auth.getRole() === role) return true;
  return router.createUrlTree(['/connexion']);
};
