import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { IdeiaInterface } from '@shared/ideia.interface';
import { catchError, Observable, throwError } from 'rxjs';
import { environment } from '@env/environment';

@Injectable({
    providedIn: 'root'
})

export class IdeiaService {
    private _httpClient = inject(HttpClient);

    saveIdeia(ideia: IdeiaInterface): Observable<IdeiaInterface>{
        return this._httpClient.post<IdeiaInterface>(`${environment.apiUrl}/ideias`, ideia)
            .pipe(catchError(this.tratarErro('Não foi possível salvar a ideia.')));
    }

    getIdeias(): Observable<IdeiaInterface[]>{
        return this._httpClient.get<IdeiaInterface[]>(`${environment.apiUrl}/ideias`)
            .pipe(catchError(this.tratarErro('Não foi possível carregar as ideias.')));
    }

    getIdeiaById(id:string): Observable<IdeiaInterface>{
        return this._httpClient.get<IdeiaInterface>(`${environment.apiUrl}/ideias/${id}`)
            .pipe(catchError(this.tratarErro('Não foi possível carregar esta ideia.')));
    }

    atualizarIdeia(id: string, dadosAtualizados: Partial<IdeiaInterface>) : Observable<IdeiaInterface>{
        return this._httpClient.put<IdeiaInterface>(`${environment.apiUrl}/ideias/${id}`, dadosAtualizados)
            .pipe(catchError(this.tratarErro('Não foi possível salvar as alterações.')));
    }

    excluirIdeia(id: string): Observable<IdeiaInterface> {
        return this._httpClient.delete<IdeiaInterface>(`${environment.apiUrl}/ideias/${id}`)
            .pipe(catchError(this.tratarErro('Não foi possível excluir a ideia.')));
    }

    private tratarErro(mensagem: string): (erro: HttpErrorResponse) => Observable<never> {
        return (erro: HttpErrorResponse) => {
            console.error(`[IdeiaService] ${mensagem}`, { status: erro.status, url: erro.url });
            return throwError(() => new Error(mensagem));
        };
    }
}
