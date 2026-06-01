import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, from, switchMap, throwError } from 'rxjs';
import { AuthService } from './auth.service';

export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);

  return from(auth.getAccessToken()).pipe(
    switchMap((token) => {
      const authReq = token
        ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
        : req;
      return next(authReq).pipe(
        catchError((err: HttpErrorResponse) => {
          if (err.status === 401) {
            auth.logout();
          }
          if (err.status === 403) {
            const message = String(err.error?.message || '');
            if (/sospes|bann|limitat/i.test(message)) {
              auth.notifyLimitedAccountAccess(
                "Accesso all'account limitato: il tuo profilo è stato sospeso."
              );
            }
          }
          return throwError(() => err);
        })
      );
    })
  );
};
