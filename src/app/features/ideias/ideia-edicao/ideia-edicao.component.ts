import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  input,
  OnInit,
  signal,
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { ComAlteracoesPendentes } from '@core/guards/alteracoes-pendentes.guard';
import { IdeiaService } from '@core/services/ideia.service';
import { mensagemDoCampo } from '@shared/mensagem-campo';

const MINIMO = 5;

@Component({
  selector: 'app-ideia-edicao',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './ideia-edicao.component.html',
  styleUrl: './ideia-edicao.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IdeiaEdicaoComponent implements OnInit, ComAlteracoesPendentes {
  readonly id = input.required<string>();

  private readonly _ideias = inject(IdeiaService);
  private readonly _router = inject(Router);
  private readonly _destroyRef = inject(DestroyRef);

  protected readonly formulario = new FormGroup({
    ideia: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(MINIMO)],
    }),
    resolve: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(MINIMO)],
    }),
    categoria: new FormControl('', { nonNullable: true }),
  });

  protected readonly carregando = signal(true);
  protected readonly bloqueada = signal(false);
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
      erroIdeia: mensagemDoCampo(controles.ideia, { rotulo: 'A ideia', minimo: MINIMO }, mostrar),
      erroResolve: mensagemDoCampo(
        controles.resolve,
        { rotulo: 'O problema', minimo: MINIMO },
        mostrar,
      ),
    };
  });

  ngOnInit(): void {
    this._ideias
      .buscarPorId(Number(this.id()))
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe({
        next: (encontrada) => {
          if (!this._ideias.ehPropria(encontrada)) {
            this.bloqueada.set(true);
            this.carregando.set(false);
            this.erro.set('Você só pode editar as suas próprias ideias.');
            return;
          }
          this.formulario.setValue({
            ideia: encontrada.ideia,
            resolve: encontrada.resolve,
            categoria: encontrada.categoria ?? '',
          });
          this.carregando.set(false);
        },
        error: (falha: Error) => {
          this.carregando.set(false);
          this.erro.set(falha.message);
        },
      });
  }

  temAlteracoesPendentes(): boolean {
    return this.formulario.dirty;
  }

  protected salvar(): void {
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
      .atualizar(Number(this.id()), {
        ideia: ideia.trim(),
        resolve: resolve.trim(),
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
