import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';

import { alteracoesPendentesGuard, ComAlteracoesPendentes } from '@core/guards/alteracoes-pendentes.guard';

function executar(pendente: boolean): boolean {
  const componente: ComAlteracoesPendentes = { temAlteracoesPendentes: () => pendente };
  const resultado = TestBed.runInInjectionContext(() =>
    alteracoesPendentesGuard(
      componente,
      {} as ActivatedRouteSnapshot,
      {} as RouterStateSnapshot,
      {} as RouterStateSnapshot,
    ),
  );
  if (typeof resultado !== 'boolean') {
    throw new Error('O guard deveria responder de forma síncrona');
  }
  return resultado;
}

describe('alteracoesPendentesGuard', () => {
  afterEach(() => vi.restoreAllMocks());

  it('libera a saída quando o formulário não foi alterado', () => {
    const confirmar = vi.spyOn(window, 'confirm');
    expect(executar(false)).toBe(true);
    expect(confirmar).not.toHaveBeenCalled();
  });

  it('pergunta e bloqueia quando o usuário cancela', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false);
    expect(executar(true)).toBe(false);
  });

  it('pergunta e libera quando o usuário confirma', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    expect(executar(true)).toBe(true);
  });
});
