import { ChangeDetectionStrategy, Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { AuthService } from '@core/services/auth.service';
import { mensagemDoCampo } from '@shared/mensagem-campo';

const MINIMO_SENHA = 8;

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginComponent {
  private readonly _auth = inject(AuthService);
  private readonly _router = inject(Router);
  private readonly _destroyRef = inject(DestroyRef);

  protected readonly formulario = new FormGroup({
    email: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email],
    }),
    senha: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(MINIMO_SENHA)],
    }),
  });

  protected readonly enviando = signal(false);
  protected readonly erro = signal<string | null>(null);

  private readonly _enviado = signal(false);
  private readonly _eventos = toSignal(this.formulario.events, { initialValue: null });

  protected readonly estado = computed(() => {
    this._eventos();
    const mostrar = this._enviado();
    const controles = this.formulario.controls;

    return {
      invalido: this.formulario.invalid,
      erroEmail: mensagemDoCampo(controles.email, { rotulo: 'O e-mail' }, mostrar),
      erroSenha: mensagemDoCampo(
        controles.senha,
        { rotulo: 'A senha', minimo: MINIMO_SENHA },
        mostrar,
      ),
    };
  });

  protected entrar(): void {
    this._enviado.set(true);

    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }

    this.erro.set(null);
    this.enviando.set(true);

    this._auth
      .entrar(this.formulario.getRawValue())
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe({
        next: () => {
          this.enviando.set(false);
          void this._router.navigate(['/ideias']);
        },
        error: (falha: Error) => {
          this.enviando.set(false);
          this.erro.set(falha.message);
        },
      });
  }
}
