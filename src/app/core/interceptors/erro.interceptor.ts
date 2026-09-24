import { HttpErrorResponse, HttpInterceptorFn, HttpStatusCode } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

import { SessaoService } from '@core/services/sessao.service';

export const erroInterceptor: HttpInterceptorFn = (requisicao, proxima) => {
  const sessao = inject(SessaoService);
  const router = inject(Router);

  return proxima(requisicao).pipe(
    catchError((erro: unknown) => {
      const naoAutorizado =
        erro instanceof HttpErrorResponse && erro.status === HttpStatusCode.Unauthorized;
      const ehRotaDeAuth = requisicao.url.includes('/auth/');

      if (naoAutorizado && !ehRotaDeAuth) {
        sessao.encerrar();
        void router.navigate(['/login']);
      }

      return throwError(() => erro);
    }),
  );
};
