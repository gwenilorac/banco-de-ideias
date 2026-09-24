import { computed, inject, Injectable, PLATFORM_ID, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

import { environment } from '@env/environment';
import { Autenticacao, ehAutenticacao, Usuario } from '@shared/usuario.interface';

@Injectable({ providedIn: 'root' })
export class SessaoService {
  private readonly _navegador = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly _sessao = signal<Autenticacao | null>(this.restaurar());

  readonly usuario = computed<Usuario | null>(() => this._sessao()?.usuario ?? null);
  readonly token = computed<string | null>(() => this._sessao()?.token ?? null);
  readonly estaAutenticado = computed<boolean>(() => this._sessao() !== null);
  readonly nomeDoAutor = computed<string>(() => this._sessao()?.usuario.nome ?? '');

  iniciar(autenticacao: Autenticacao): void {
    this._sessao.set(autenticacao);
    this.gravar(autenticacao);
  }

  encerrar(): void {
    this._sessao.set(null);
    this.apagar();
  }

  private gravar(autenticacao: Autenticacao): void {
    if (!this._navegador) {
      return;
    }
    try {
      localStorage.setItem(environment.chaveSessao, JSON.stringify(autenticacao));
    } catch {
    }
  }

  private apagar(): void {
    if (!this._navegador) {
      return;
    }
    try {
      localStorage.removeItem(environment.chaveSessao);
    } catch {
    }
  }

  private restaurar(): Autenticacao | null {
    if (!this._navegador) {
      return null;
    }

    let bruto: string | null = null;
    try {
      bruto = localStorage.getItem(environment.chaveSessao);
    } catch {
      return null;
    }
    if (bruto === null) {
      return null;
    }

    let analisado: unknown;
    try {
      analisado = JSON.parse(bruto);
    } catch {
      return null;
    }

    return ehAutenticacao(analisado) ? analisado : null;
  }
}
