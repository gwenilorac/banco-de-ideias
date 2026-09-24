import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, Observable, tap, throwError } from 'rxjs';

import { environment } from '@env/environment';
import { detalhesDeValidacao, mensagemDeErro } from '@core/mensagem-erro';
import { SessaoService } from '@core/services/sessao.service';
import { Autenticacao, CadastroInput, LoginInput, Usuario } from '@shared/usuario.interface';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly _http = inject(HttpClient);
  private readonly _sessao = inject(SessaoService);

  entrar(dados: LoginInput): Observable<Autenticacao> {
    return this._http
      .post<Autenticacao>(`${environment.apiUrl}/auth/login`, dados)
      .pipe(
        tap((autenticacao) => this._sessao.iniciar(autenticacao)),
        catchError(this.traduzir('Não foi possível entrar. Tente novamente.')),
      );
  }

  cadastrar(dados: CadastroInput): Observable<Autenticacao> {
    return this._http
      .post<Autenticacao>(`${environment.apiUrl}/auth/cadastro`, dados)
      .pipe(
        tap((autenticacao) => this._sessao.iniciar(autenticacao)),
        catchError(this.traduzir('Não foi possível concluir o cadastro. Tente novamente.')),
      );
  }

  perfil(): Observable<Usuario> {
    return this._http
      .get<Usuario>(`${environment.apiUrl}/auth/perfil`)
      .pipe(catchError(this.traduzir('Não foi possível confirmar sua sessão.')));
  }

  sair(): void {
    this._sessao.encerrar();
  }

  private traduzir(padrao: string): (erro: HttpErrorResponse) => Observable<never> {
    return (erro: HttpErrorResponse) => {
      const detalhes = detalhesDeValidacao(erro);
      const mensagem = detalhes ?? mensagemDeErro(erro, padrao);
      return throwError(() => new Error(mensagem));
    };
  }
}
