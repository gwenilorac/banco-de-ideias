import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, Router } from '@angular/router';

import { environment } from '@env/environment';
import { erroInterceptor } from '@core/interceptors/erro.interceptor';
import { SessaoService } from '@core/services/sessao.service';

describe('erroInterceptor', () => {
  let http: HttpClient;
  let controle: HttpTestingController;
  let router: Router;
  let sessao: SessaoService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([erroInterceptor])),
        provideHttpClientTesting(),
        provideRouter([]),
      ],
    });

    http = TestBed.inject(HttpClient);
    controle = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
    sessao = TestBed.inject(SessaoService);
    sessao.iniciar({
      token: 'expirado',
      usuario: { id: 1, nome: 'Caroline', email: 'c@e.com', criadoEm: '', atualizadoEm: '' },
    });
    vi.spyOn(router, 'navigate').mockResolvedValue(true);
  });

  afterEach(() => controle.verify());

  it('encerra a sessão e redireciona para o login no 401', () => {
    http.get(`${environment.apiUrl}/ideias`).subscribe({ error: () => undefined });
    controle
      .expectOne(`${environment.apiUrl}/ideias`)
      .flush({ erro: 'Token inválido' }, { status: 401, statusText: 'Unauthorized' });

    expect(sessao.estaAutenticado()).toBe(false);
    expect(router.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('não redireciona em 401 das rotas de autenticação', () => {
    http.post(`${environment.apiUrl}/auth/login`, {}).subscribe({ error: () => undefined });
    controle
      .expectOne(`${environment.apiUrl}/auth/login`)
      .flush({ erro: 'Senha errada' }, { status: 401, statusText: 'Unauthorized' });

    expect(sessao.estaAutenticado()).toBe(true);
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('repassa os demais erros sem redirecionar', () => {
    let status = 0;
    http.get(`${environment.apiUrl}/ideias`).subscribe({
      error: (erro: { status: number }) => (status = erro.status),
    });
    controle
      .expectOne(`${environment.apiUrl}/ideias`)
      .flush(null, { status: 500, statusText: 'Server Error' });

    expect(status).toBe(500);
    expect(router.navigate).not.toHaveBeenCalled();
  });
});
