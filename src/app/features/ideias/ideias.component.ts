import { ChangeDetectionStrategy, Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { catchError, debounceTime, distinctUntilChanged, EMPTY, switchMap, tap } from 'rxjs';

import { AuthService } from '@core/services/auth.service';
import { IdeiaService } from '@core/services/ideia.service';
import { SessaoService } from '@core/services/sessao.service';
import { VotoService } from '@core/services/voto.service';
import { IdeiaFiltrosComponent } from '@features/ideias/ideia-filtros/ideia-filtros.component';
import { IdeiaListaComponent } from '@features/ideias/ideia-lista/ideia-lista.component';
import { FILTROS_PADRAO, FiltrosBusca, Ideia, Ordenacao } from '@shared/ideia.interface';

const ESPERA_DA_BUSCA_MS = 300;
const LIMITE_DA_BUSCA = 100;

const COMPARADORES: Record<Ordenacao, (a: Ideia, b: Ideia) => number> = {
  recentes: (a, b) => b.criadoEm.localeCompare(a.criadoEm),
  antigas: (a, b) => a.criadoEm.localeCompare(b.criadoEm),
  votadas: (a, b) => b.votos - a.votos || b.criadoEm.localeCompare(a.criadoEm),
};

interface ResumoDaBusca {
  readonly total: number;
  readonly totalDeVotos: number;
  readonly mediaDeVotos: number;
  readonly minhas: number;
  readonly percentualMinhas: number;
  readonly votosRecebidos: number;
  readonly categoriaEmAlta: string | null;
  readonly maisVotada: Ideia | null;
}

@Component({
  selector: 'app-ideias',
  imports: [IdeiaFiltrosComponent, IdeiaListaComponent, RouterLink],
  templateUrl: './ideias.component.html',
  styleUrl: './ideias.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IdeiasComponent {
  private readonly _ideias = inject(IdeiaService);
  private readonly _auth = inject(AuthService);
  private readonly _sessao = inject(SessaoService);
  private readonly _votos = inject(VotoService);
  private readonly _router = inject(Router);
  private readonly _destroyRef = inject(DestroyRef);

  private readonly _encontradas = signal<readonly Ideia[]>([]);
  private readonly _filtros = signal<FiltrosBusca>(FILTROS_PADRAO);
  private readonly _termo = computed(() => this._filtros().texto.trim());

  protected readonly carregando = signal(true);
  protected readonly erro = signal<string | null>(null);
  protected readonly usuario = this._sessao.usuario;
  protected readonly idsVotados = this._votos.ativos;

  private readonly _exibidas = computed<readonly Ideia[]>(() =>
    this._encontradas().map((item) => ({ ...item, votos: this._votos.votosExibidos(item) })),
  );

  protected readonly categorias = computed<readonly string[]>(() =>
    [...new Set(this._exibidas().flatMap((item) => (item.categoria ? [item.categoria] : [])))].sort(
      (a, b) => a.localeCompare(b, 'pt-BR'),
    ),
  );

  protected readonly idsProprios = computed<ReadonlySet<number>>(
    () =>
      new Set(
        this._exibidas()
          .filter((item) => this._ideias.ehPropria(item))
          .map((item) => item.id),
      ),
  );

  protected readonly resultado = computed<readonly Ideia[]>(() => {
    const { categoria, autoria, ordem } = this._filtros();
    const proprios = this.idsProprios();

    const filtradas = this._exibidas()
      .filter((item) => categoria === '' || item.categoria === categoria)
      .filter((item) => autoria === 'todas' || proprios.has(item.id) === (autoria === 'minhas'));

    return [...filtradas].sort(COMPARADORES[ordem]);
  });

  protected readonly resumo = computed<ResumoDaBusca>(() => {
    const lista = this.resultado();
    const proprios = this.idsProprios();

    const porCategoria = new Map<string, { quantidade: number; votos: number }>();
    let totalDeVotos = 0;
    let minhas = 0;
    let votosRecebidos = 0;
    let maisVotada: Ideia | null = null;

    for (const item of lista) {
      totalDeVotos += item.votos;

      if (proprios.has(item.id)) {
        minhas += 1;
        votosRecebidos += item.votos;
      }

      if (maisVotada === null || item.votos > maisVotada.votos) {
        maisVotada = item;
      }

      if (item.categoria) {
        const atual = porCategoria.get(item.categoria) ?? { quantidade: 0, votos: 0 };
        porCategoria.set(item.categoria, {
          quantidade: atual.quantidade + 1,
          votos: atual.votos + item.votos,
        });
      }
    }

    const categoriaEmAlta =
      [...porCategoria.entries()].sort(
        ([, a], [, b]) => b.votos - a.votos || b.quantidade - a.quantidade,
      )[0]?.[0] ?? null;

    const total = lista.length;

    return {
      total,
      totalDeVotos,
      mediaDeVotos: total === 0 ? 0 : Math.round((totalDeVotos / total) * 10) / 10,
      minhas,
      percentualMinhas: total === 0 ? 0 : Math.round((minhas / total) * 100),
      votosRecebidos,
      categoriaEmAlta,
      maisVotada: maisVotada !== null && maisVotada.votos > 0 ? maisVotada : null,
    };
  });

  constructor() {
    toObservable(this._termo)
      .pipe(
        debounceTime(ESPERA_DA_BUSCA_MS),
        distinctUntilChanged(),
        tap(() => {
          this.carregando.set(true);
          this.erro.set(null);
        }),
        switchMap((termo) =>
          this._ideias.listar({ limite: LIMITE_DA_BUSCA, ...(termo ? { q: termo } : {}) }).pipe(
            catchError((falha: Error) => {
              this.carregando.set(false);
              this.erro.set(falha.message);
              return EMPTY;
            }),
          ),
        ),
        takeUntilDestroyed(),
      )
      .subscribe((pagina) => {
        this._encontradas.set(pagina.dados);
        this.carregando.set(false);
      });
  }

  protected filtrar(filtros: FiltrosBusca): void {
    this._filtros.set(filtros);
  }

  protected alternarVoto(ideia: Ideia): void {
    const original = this._encontradas().find((item) => item.id === ideia.id);
    if (!original) {
      return;
    }

    this.erro.set(null);
    this._ideias
      .alternarVoto(original)
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe({
        next: (atualizada) => this.substituir(atualizada),
        error: (falha: Error) => this.erro.set(falha.message),
      });
  }

  protected excluir(ideia: Ideia): void {
    if (!confirm(`Excluir a ideia "${ideia.ideia}"? Essa ação não pode ser desfeita.`)) {
      return;
    }

    this._ideias
      .excluir(ideia.id)
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe({
        next: () =>
          this._encontradas.update((lista) => lista.filter((item) => item.id !== ideia.id)),
        error: (falha: Error) => this.erro.set(falha.message),
      });
  }

  protected sair(): void {
    this._auth.sair();
    void this._router.navigate(['/login']);
  }

  private substituir(atualizada: Ideia): void {
    this._encontradas.update((lista) =>
      lista.map((item) => (item.id === atualizada.id ? atualizada : item)),
    );
  }
}
