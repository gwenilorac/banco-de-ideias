import { Routes } from '@angular/router';

import { alteracoesPendentesGuard } from '@core/guards/alteracoes-pendentes.guard';
import { autenticacaoGuard, visitanteGuard } from '@core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'ideias',
  },
  {
    path: 'login',
    title: 'Entrar · Banco de Ideias',
    canActivate: [visitanteGuard],
    loadComponent: () =>
      import('@features/auth/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'cadastro',
    title: 'Criar conta · Banco de Ideias',
    canActivate: [visitanteGuard],
    loadComponent: () =>
      import('@features/auth/cadastro-usuario/cadastro-usuario.component').then(
        (m) => m.CadastroUsuarioComponent,
      ),
  },
  {
    path: 'ideias/nova',
    title: 'Nova ideia · Banco de Ideias',
    canActivate: [autenticacaoGuard],
    canDeactivate: [alteracoesPendentesGuard],
    loadComponent: () =>
      import('@features/ideias/ideia-cadastro/ideia-cadastro.component').then(
        (m) => m.IdeiaCadastroComponent,
      ),
  },
  {
    path: 'ideias/:id/editar',
    title: 'Editar ideia · Banco de Ideias',
    canActivate: [autenticacaoGuard],
    canDeactivate: [alteracoesPendentesGuard],
    loadComponent: () =>
      import('@features/ideias/ideia-edicao/ideia-edicao.component').then(
        (m) => m.IdeiaEdicaoComponent,
      ),
  },
  {
    path: 'ideias',
    title: 'Ideias · Banco de Ideias',
    canActivate: [autenticacaoGuard],
    loadComponent: () =>
      import('@features/ideias/ideias.component').then((m) => m.IdeiasComponent),
  },
  {
    path: '**',
    redirectTo: 'ideias',
  },
];
