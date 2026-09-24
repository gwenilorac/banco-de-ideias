import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';

import { SessaoService } from '@core/services/sessao.service';

export const autenticacaoInterceptor: HttpInterceptorFn = (requisicao, proxima) => {
  const token = inject(SessaoService).token();

  if (token === null) {
    return proxima(requisicao);
  }

  return proxima(requisicao.clone({ setHeaders: { Authorization: `Bearer ${token}` } }));
};
