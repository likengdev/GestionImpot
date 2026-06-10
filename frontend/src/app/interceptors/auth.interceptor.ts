import { HttpInterceptorFn, HttpErrorResponse, HttpRequest, HttpHandlerFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError, switchMap, BehaviorSubject, filter, take } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

// Variables de module pour le refresh token (partagées entre tous les appels)
let isRefreshing = false;
const refreshTokenSubject = new BehaviorSubject<string | null>(null);

const addToken = (req: HttpRequest<any>, token: string): HttpRequest<any> =>
  req.clone({ headers: req.headers.set('Authorization', `Bearer ${token}`) });

const handle401 = (req: HttpRequest<any>, next: HttpHandlerFn, router: Router, http: HttpClient) => {
  // Si un refresh est déjà en cours, attendre qu'il se termine
  if (isRefreshing) {
    return refreshTokenSubject.pipe(
      filter(token => token !== null),
      take(1),
      switchMap(token => next(addToken(req, token!)))
    );
  }

  isRefreshing = true;
  refreshTokenSubject.next(null);

  const refresh = localStorage.getItem('refresh_token');
  if (!refresh) {
    isRefreshing = false;
    localStorage.clear();
    router.navigate(['/login']);
    return throwError(() => new Error('Aucun refresh token disponible.'));
  }

  return http.post<any>(`${environment.apiUrl}/auth/refresh/`, { refresh }).pipe(
    switchMap(response => {
      isRefreshing = false;
      const newToken = response.access;
      localStorage.setItem('access_token', newToken);
      refreshTokenSubject.next(newToken);
      // CORRIGÉ : rejouer la requête originale avec le nouveau token
      return next(addToken(req, newToken));
    }),
    catchError(err => {
      isRefreshing = false;
      refreshTokenSubject.next(null);
      localStorage.clear();
      router.navigate(['/login']);
      return throwError(() => err);
    })
  );
};

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const http = inject(HttpClient);
  const token = localStorage.getItem('access_token');

  // Ne pas injecter le token sur les requêtes de refresh/login
  const isAuthUrl = req.url.includes('/auth/login') || req.url.includes('/auth/refresh');
  const authReq = (token && !isAuthUrl) ? addToken(req, token) : req;

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 && !req.url.includes('/auth/refresh') && !req.url.includes('/auth/login')) {
        return handle401(req, next, router, http);
      }
      if (error.status === 403) {
        // Accès refusé : rediriger vers le dashboard sans déconnecter
        router.navigate(['/dashboard']);
      }
      return throwError(() => error);
    })
  );
};
