import {
  HttpInterceptorFn, HttpErrorResponse
} from '@angular/common/http';
import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser }   from '@angular/common';
import { Router }              from '@angular/router';
import { catchError, throwError } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const router     = inject(Router);
  const platformId = inject(PLATFORM_ID);
  const estNav     = isPlatformBrowser(platformId);

  const token = estNav ? localStorage.getItem('token') : null;

  const requete = token
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  return next(requete).pipe(
    catchError((erreur: HttpErrorResponse) => {
      if (erreur.status === 401 && estNav) {
        localStorage.clear();
        router.navigate(['/connexion']);
      }
      const message =
        erreur.error?.erreur  ||
        erreur.error?.message ||
        erreur.message        ||
        'Une erreur est survenue';
      return throwError(() => message);
    })
  );
};
