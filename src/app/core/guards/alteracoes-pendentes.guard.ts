import { CanDeactivateFn } from '@angular/router';

export interface ComAlteracoesPendentes {
  temAlteracoesPendentes(): boolean;
}

export const alteracoesPendentesGuard: CanDeactivateFn<ComAlteracoesPendentes> = (componente) =>
  !componente.temAlteracoesPendentes() ||
  confirm('Existem alterações não salvas. Deseja sair mesmo assim?');
