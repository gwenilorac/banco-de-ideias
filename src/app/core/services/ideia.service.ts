import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, EMPTY, finalize, Observable, of, tap, throwError } from 'rxjs';

import { environment } from '@env/environment';
import { mensagemDeErro } from '@core/mensagem-erro';
import { SessaoService } from '@core/services/sessao.service';
import { VotoService } from '@core/services/voto.service';
import { FiltroIdeias, Ideia, IdeiaInput, ListaDeIdeias } from '@shared/ideia.interface';

@Injectable({ providedIn: 'root' })
export class IdeiaService {
  private readonly _http = inject(HttpClient);
  private readonly _sessao = inject(SessaoService);
  private readonly _votos = inject(VotoService);
  private readonly _url = `${environment.apiUrl}/ideias`;
  private readonly _votosPendentes = new Set<number>();

  listar(filtro: FiltroIdeias = {}): Observable<ListaDeIdeias> {
    let params = new HttpParams();
    if (filtro.q) {
      params = params.set('q', filtro.q);
    }
    if (filtro.categoria) {
      params = params.set('categoria', filtro.categoria);
    }
    if (filtro.pagina !== undefined) {
      params = params.set('pagina', filtro.pagina);
    }
    if (filtro.limite !== undefined) {
      params = params.set('limite', filtro.limite);
    }

    return this._http
      .get<ListaDeIdeias>(this._url, { params })
      .pipe(catchError(this.traduzir('Não foi possível carregar as ideias.')));
  }

  buscarPorId(id: number): Observable<Ideia> {
    return this._http
      .get<Ideia>(`${this._url}/${id}`)
      .pipe(catchError(this.traduzir('Não foi possível carregar esta ideia.')));
  }

  criar(dados: IdeiaInput): Observable<Ideia> {
    return this._http
      .post<Ideia>(this._url, dados)
      .pipe(catchError(this.traduzir('Não foi possível cadastrar a ideia.')));
  }

  atualizar(id: number, dados: Partial<IdeiaInput>): Observable<Ideia> {
    return this._http
      .put<Ideia>(`${this._url}/${id}`, dados)
      .pipe(catchError(this.traduzir('Não foi possível salvar as alterações.')));
  }

  excluir(id: number): Observable<void> {
    return this._http
      .delete<void>(`${this._url}/${id}`)
      .pipe(catchError(this.traduzir('Não foi possível excluir a ideia.')));
  }

  ehPropria(ideia: Ideia): boolean {
    const autor = this._sessao.nomeDoAutor();
    return autor.length > 0 && ideia.autor === autor;
  }

  alternarVoto(ideia: Ideia): Observable<Ideia> {
    if (this.ehPropria(ideia)) {
      return throwError(() => new Error('Você não pode votar na sua própria ideia.'));
    }

    if (this._votosPendentes.has(ideia.id)) {
      return EMPTY;
    }

    if (this._votos.votou(ideia)) {
      this._votos.desmarcar(ideia);
      return of(ideia);
    }

    if (this._votos.jaContabilizado(ideia)) {
      this._votos.marcar(ideia);
      return of(ideia);
    }

    this._votosPendentes.add(ideia.id);

    return this._http.patch<Ideia>(`${this._url}/${ideia.id}/votar`, {}).pipe(
      tap((atualizada) => this._votos.marcar(atualizada)),
      catchError(this.traduzir('Não foi possível registrar seu voto.')),
      finalize(() => this._votosPendentes.delete(ideia.id)),
    );
  }

  private traduzir(padrao: string): (erro: HttpErrorResponse) => Observable<never> {
    return (erro: HttpErrorResponse) => throwError(() => new Error(mensagemDeErro(erro, padrao)));
  }
}
