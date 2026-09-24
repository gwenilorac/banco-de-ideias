import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';

import { environment } from '@env/environment';
import { LoginComponent } from '@features/auth/login/login.component';
import { SessaoService } from '@core/services/sessao.service';

describe('LoginComponent', () => {
  let fixture: ComponentFixture<LoginComponent>;
  let http: HttpTestingController;

  function elemento(): HTMLElement {
    return fixture.nativeElement as HTMLElement;
  }

  function preencher(seletor: string, valor: string): void {
    const campo = elemento().querySelector<HTMLInputElement>(seletor);
    if (!campo) {
      throw new Error(`Campo não encontrado: ${seletor}`);
    }
    campo.value = valor;
    campo.dispatchEvent(new Event('input'));
  }

  function enviar(): void {
    elemento().querySelector('form')?.dispatchEvent(new Event('submit'));
  }

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([{ path: 'ideias', children: [] }]),
      ],
    }).compileComponents();

    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(LoginComponent);
  });

  afterEach(() => http.verify());

  it('começa com o envio bloqueado e sem mensagens de erro', async () => {
    await fixture.whenStable();

    expect(elemento().querySelector<HTMLButtonElement>('button[type="submit"]')?.disabled).toBe(true);
    expect(elemento().querySelectorAll('.campo__erro').length).toBe(0);
  });

  it('cobra os campos obrigatórios ao tentar enviar vazio', async () => {
    await fixture.whenStable();
    enviar();
    await fixture.whenStable();

    const erros = Array.from(elemento().querySelectorAll('.campo__erro')).map((e) => e.textContent);
    expect(erros.length).toBe(2);
    expect(erros.join(' ')).toContain('obrigatório');
  });

  it('valida o formato do e-mail e o tamanho da senha', async () => {
    await fixture.whenStable();

    preencher('#email', 'nao-e-email');
    preencher('#senha', '123');
    enviar();
    await fixture.whenStable();

    const texto = elemento().textContent ?? '';
    expect(texto).toContain('Informe um e-mail válido.');
    expect(texto).toContain('pelo menos 8 caracteres');
  });

  it('salva o token no LocalStorage após autenticar', async () => {
    await fixture.whenStable();

    preencher('#email', 'caroline@exemplo.com');
    preencher('#senha', 'senha12345');
    await fixture.whenStable();
    enviar();
    await fixture.whenStable();

    const requisicao = http.expectOne(`${environment.apiUrl}/auth/login`);
    expect(requisicao.request.method).toBe('POST');
    expect(requisicao.request.body).toEqual({
      email: 'caroline@exemplo.com',
      senha: 'senha12345',
    });

    requisicao.flush({
      token: 'token-recebido',
      usuario: {
        id: 1,
        nome: 'Caroline',
        email: 'caroline@exemplo.com',
        criadoEm: '2026-09-14T00:00:00.000Z',
        atualizadoEm: '2026-09-14T00:00:00.000Z',
      },
    });
    await fixture.whenStable();

    expect(TestBed.inject(SessaoService).token()).toBe('token-recebido');
    expect(localStorage.getItem(environment.chaveSessao)).toContain('token-recebido');
  });

  it('mostra a mensagem da API quando as credenciais estão erradas', async () => {
    await fixture.whenStable();

    preencher('#email', 'caroline@exemplo.com');
    preencher('#senha', 'senhaerrada1');
    await fixture.whenStable();
    enviar();
    await fixture.whenStable();

    http
      .expectOne(`${environment.apiUrl}/auth/login`)
      .flush({ erro: 'E-mail ou senha inválidos.' }, { status: 401, statusText: 'Unauthorized' });
    await fixture.whenStable();

    const texto = elemento().textContent ?? '';
    expect(texto).toContain('E-mail ou senha inválidos.');
    expect(texto).not.toContain('401');
  });
});
