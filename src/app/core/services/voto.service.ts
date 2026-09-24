import { computed, inject, Injectable, PLATFORM_ID, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

import { environment } from '@env/environment';
import { SessaoService } from '@core/services/sessao.service';
import { Ideia } from '@shared/ideia.interface';

interface VotosDoUsuario {
  readonly ativos: readonly number[];
  readonly contabilizados: readonly number[];
}

type RegistroDeVotos = Readonly<Record<string, VotosDoUsuario>>;

const SEM_VOTOS: VotosDoUsuario = { ativos: [], contabilizados: [] };

function ehListaDeIds(valor: unknown): valor is number[] {
  return Array.isArray(valor) && valor.every((id) => typeof id === 'number');
}

function ehVotosDoUsuario(valor: unknown): valor is VotosDoUsuario {
  if (typeof valor !== 'object' || valor === null) {
    return false;
  }
  const campos = valor as Record<string, unknown>;
  return ehListaDeIds(campos['ativos']) && ehListaDeIds(campos['contabilizados']);
}

function ehRegistroDeVotos(valor: unknown): valor is RegistroDeVotos {
  return (
    typeof valor === 'object' &&
    valor !== null &&
    !Array.isArray(valor) &&
    Object.values(valor).every(ehVotosDoUsuario)
  );
}

@Injectable({ providedIn: 'root' })
export class VotoService {
  private readonly _sessao = inject(SessaoService);
  private readonly _navegador = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly _registro = signal<RegistroDeVotos>(this.restaurar());

  private readonly _chaveUsuario = computed(() => {
    const usuario = this._sessao.usuario();
    return usuario === null ? null : String(usuario.id);
  });

  private readonly _doUsuario = computed<VotosDoUsuario>(() => {
    const chave = this._chaveUsuario();
    return chave === null ? SEM_VOTOS : (this._registro()[chave] ?? SEM_VOTOS);
  });

  readonly ativos = computed<ReadonlySet<number>>(() => new Set(this._doUsuario().ativos));
  private readonly _contabilizados = computed<ReadonlySet<number>>(
    () => new Set(this._doUsuario().contabilizados),
  );

  votou(ideia: Ideia): boolean {
    return this.ativos().has(ideia.id);
  }

  jaContabilizado(ideia: Ideia): boolean {
    return this._contabilizados().has(ideia.id);
  }

  votosExibidos(ideia: Ideia): number {
    const retirado = this.jaContabilizado(ideia) && !this.votou(ideia);
    return Math.max(0, ideia.votos - (retirado ? 1 : 0));
  }

  marcar(ideia: Ideia): void {
    this.alterar((atual) => ({
      ativos: [...new Set([...atual.ativos, ideia.id])],
      contabilizados: [...new Set([...atual.contabilizados, ideia.id])],
    }));
  }

  desmarcar(ideia: Ideia): void {
    this.alterar((atual) => ({
      ativos: atual.ativos.filter((id) => id !== ideia.id),
      contabilizados: atual.contabilizados,
    }));
  }

  private alterar(transformar: (atual: VotosDoUsuario) => VotosDoUsuario): void {
    const chave = this._chaveUsuario();
    if (chave === null) {
      return;
    }

    const novo: RegistroDeVotos = {
      ...this._registro(),
      [chave]: transformar(this._doUsuario()),
    };
    this._registro.set(novo);
    this.gravar(novo);
  }

  private gravar(registro: RegistroDeVotos): void {
    if (!this._navegador) {
      return;
    }
    try {
      localStorage.setItem(environment.chaveVotos, JSON.stringify(registro));
    } catch {
      return;
    }
  }

  private restaurar(): RegistroDeVotos {
    if (!this._navegador) {
      return {};
    }

    try {
      const bruto = localStorage.getItem(environment.chaveVotos);
      const analisado: unknown = bruto === null ? {} : JSON.parse(bruto);
      return ehRegistroDeVotos(analisado) ? analisado : {};
    } catch {
      return {};
    }
  }
}
