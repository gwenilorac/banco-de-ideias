import { ChangeDetectionStrategy, Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { AuthService } from '@core/services/auth.service';
import { mensagemDoCampo } from '@shared/mensagem-campo';
import { ERRO_SENHAS_DIFERENTES, senhasIguais } from '@shared/validadores/senhas-iguais.validator';

const MINIMO_NOME = 2;
const MINIMO_SENHA = 8;

@Component({
  selector: 'app-cadastro-usuario',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './cadastro-usuario.component.html',
  styleUrl: './cadastro-usuario.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CadastroUsuarioComponent {
  private readonly _auth = inject(AuthService);
  private readonly _router = inject(Router);
  private readonly _destroyRef = inject(DestroyRef);

  protected readonly formulario = new FormGroup(
    {
      nome: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required, Validators.minLength(MINIMO_NOME)],
      }),
      email: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required, Validators.email],
      }),
      senha: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required, Validators.minLength(MINIMO_SENHA)],
      }),
      confirmacao: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required],
      }),
    },
    { validators: senhasIguais('senha', 'confirmacao') },
  );

  protected readonly enviando = signal(false);
  protected readonly erro = signal<string | null>(null);

  private readonly _enviado = signal(false);
  private readonly _eventos = toSignal(this.formulario.events, { initialValue: null });

  protected readonly estado = computed(() => {
    this._eventos();
    const mostrar = this._enviado();
    const controles = this.formulario.controls;
    const confirmacaoTocada = controles.confirmacao.touched || mostrar;

    return {
      invalido: this.formulario.invalid,
      erroNome: mensagemDoCampo(controles.nome, { rotulo: 'O nome', minimo: MINIMO_NOME }, mostrar),
      erroEmail: mensagemDoCampo(controles.email, { rotulo: 'O e-mail' }, mostrar),
      erroSenha: mensagemDoCampo(
        controles.senha,
        { rotulo: 'A senha', minimo: MINIMO_SENHA },
        mostrar,
      ),
      erroConfirmacao:
        mensagemDoCampo(controles.confirmacao, { rotulo: 'A confirmação' }, mostrar) ??
        (confirmacaoTocada && this.formulario.hasError(ERRO_SENHAS_DIFERENTES)
          ? 'As senhas não conferem.'
          : null),
    };
  });

  protected cadastrar(): void {
    this._enviado.set(true);

    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }

    this.erro.set(null);
    this.enviando.set(true);

    const { nome, email, senha } = this.formulario.getRawValue();

    this._auth
      .cadastrar({ nome: nome.trim(), email: email.trim(), senha })
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
