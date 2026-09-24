import { ChangeDetectionStrategy, Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { ComAlteracoesPendentes } from '@core/guards/alteracoes-pendentes.guard';
import { IdeiaService } from '@core/services/ideia.service';
import { SessaoService } from '@core/services/sessao.service';
import { mensagemDoCampo } from '@shared/mensagem-campo';

const MINIMO_IDEIA = 5;
const MINIMO_RESOLVE = 5;

@Component({
  selector: 'app-ideia-cadastro',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './ideia-cadastro.component.html',
  styleUrl: './ideia-cadastro.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IdeiaCadastroComponent implements ComAlteracoesPendentes {
  private readonly _ideias = inject(IdeiaService);
  private readonly _sessao = inject(SessaoService);
  private readonly _router = inject(Router);
  private readonly _destroyRef = inject(DestroyRef);

  protected readonly formulario = new FormGroup({
    ideia: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(MINIMO_IDEIA)],
    }),
    resolve: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(MINIMO_RESOLVE)],
    }),
    categoria: new FormControl('', { nonNullable: true }),
  });

  protected readonly salvando = signal(false);
  protected readonly erro = signal<string | null>(null);

  private readonly _enviado = signal(false);
  private readonly _eventos = toSignal(this.formulario.events, { initialValue: null });

  protected readonly estado = computed(() => {
    this._eventos();
    const mostrar = this._enviado();
    const controles = this.formulario.controls;

    return {
      invalido: this.formulario.invalid,
      erroIdeia: mensagemDoCampo(
        controles.ideia,
        { rotulo: 'A ideia', minimo: MINIMO_IDEIA },
        mostrar,
      ),
      erroResolve: mensagemDoCampo(
        controles.resolve,
        { rotulo: 'O problema', minimo: MINIMO_RESOLVE },
        mostrar,
      ),
    };
  });

  temAlteracoesPendentes(): boolean {
    return this.formulario.dirty;
  }

  protected enviar(): void {
    this._enviado.set(true);

    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }

    this.erro.set(null);
    this.salvando.set(true);

    const { ideia, resolve, categoria } = this.formulario.getRawValue();
    const categoriaLimpa = categoria.trim();

    this._ideias
      .criar({
        ideia: ideia.trim(),
        resolve: resolve.trim(),
        autor: this._sessao.nomeDoAutor(),
        ...(categoriaLimpa.length > 0 ? { categoria: categoriaLimpa } : {}),
      })
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe({
        next: () => {
          this.salvando.set(false);
          this.formulario.markAsPristine();
          void this._router.navigate(['/ideias']);
        },
        error: (falha: Error) => {
          this.salvando.set(false);
          this.erro.set(falha.message);
        },
      });
  }
}
