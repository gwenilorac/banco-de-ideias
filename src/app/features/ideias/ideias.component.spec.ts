import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting, TestRequest } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';

import { environment } from '@env/environment';
import { autenticacaoInterceptor } from '@core/interceptors/auth.interceptor';
import { erroInterceptor } from '@core/interceptors/erro.interceptor';
import { IdeiasComponent } from '@features/ideias/ideias.component';
import { Ideia, ListaDeIdeias } from '@shared/ideia.interface';

const NOME = 'Caroline';

function ideia(id: number, texto: string, autor: string | null, votos = 0, categoria = 'produto'): Ideia {
  return {
    id,
    ideia: texto,
    resolve: 'Resolve um problema qualquer.',
    autor: autor ?? '',
    categoria,
    votos,
    criadoEm: `2026-09-${String(10 + id).padStart(2, '0')}T00:00:00.000Z`,
    atualizadoEm: '2026-09-14T00:00:00.000Z',
  };
}

function envelope(dados: readonly Ideia[]): ListaDeIdeias {
  return { total: dados.length, pagina: 1, limite: 100, paginas: 1, dados };
}

function esperar(ms: number): Promise<void> {
  return new Promise((resolver) => setTimeout(resolver, ms));
}

describe('IdeiasComponent', () => {
  let fixture: ComponentFixture<IdeiasComponent> | null;
  let http: HttpTestingController;

  function componente(): ComponentFixture<IdeiasComponent> {
    fixture ??= TestBed.createComponent(IdeiasComponent);
    return fixture;
  }

  function elemento(): HTMLElement {
    return componente().nativeElement as HTMLElement;
  }

  function cartoes(): HTMLElement[] {
    return Array.from(elemento().querySelectorAll<HTMLElement>('app-card'));
  }

  async function busca(): Promise<TestRequest> {
    await componente().whenStable();
    await esperar(350);
    return http.expectOne((r) => r.method === 'GET' && r.url === `${environment.apiUrl}/ideias`);
  }

  async function carregar(dados: readonly Ideia[]): Promise<void> {
    (await busca()).flush(envelope(dados));
    await componente().whenStable();
  }

  beforeEach(async () => {
    localStorage.clear();
    localStorage.setItem(
      environment.chaveSessao,
      JSON.stringify({
        token: 'token-de-teste',
        usuario: {
          id: 1,
          nome: NOME,
          email: 'caroline@exemplo.com',
          criadoEm: '2026-09-14T00:00:00.000Z',
          atualizadoEm: '2026-09-14T00:00:00.000Z',
        },
      }),
    );

    await TestBed.configureTestingModule({
      imports: [IdeiasComponent],
      providers: [
        provideHttpClient(withInterceptors([autenticacaoInterceptor, erroInterceptor])),
        provideHttpClientTesting(),
        provideRouter([]),
      ],
    }).compileComponents();

    http = TestBed.inject(HttpTestingController);
    fixture = null;
  });

  afterEach(() => http.verify());

  it('mostra as ideias de todos os usuários', async () => {
    const requisicao = await busca();
    expect(requisicao.request.headers.get('Authorization')).toBe('Bearer token-de-teste');

    requisicao.flush(
      envelope([ideia(1, 'Minha primeira', NOME), ideia(2, 'Ideia do Felipe', 'Felipe')]),
    );
    await componente().whenStable();

    expect(cartoes().length).toBe(2);
    const texto = elemento().textContent ?? '';
    expect(texto).toContain('Minha primeira');
    expect(texto).toContain('Ideia do Felipe');
  });

  it('não deixa votar na própria ideia', async () => {
    await carregar([ideia(1, 'Minha ideia', NOME), ideia(2, 'Ideia do Felipe', 'Felipe')]);

    const porTitulo = (titulo: string): HTMLElement => {
      const cartao = cartoes().find((c) => c.querySelector('h3')?.textContent === titulo);
      if (!cartao) {
        throw new Error(`Cartão não encontrado: ${titulo}`);
      }
      return cartao;
    };
    const minha = porTitulo('Minha ideia');
    const outra = porTitulo('Ideia do Felipe');
    expect(minha.querySelector<HTMLButtonElement>('.votos')?.disabled).toBe(true);
    expect(outra.querySelector<HTMLButtonElement>('.votos')?.disabled).toBe(false);
    expect(minha.textContent).toContain('Editar');
    expect(outra.textContent).not.toContain('Editar');
  });

  it('vota, desvota e vota de novo sem somar dois votos no servidor', async () => {
    await carregar([ideia(2, 'Ideia do Felipe', 'Felipe', 4)]);

    const botao = (): HTMLButtonElement => {
      const encontrado = cartoes()[0].querySelector<HTMLButtonElement>('.votos');
      if (!encontrado) {
        throw new Error('Botão de voto não encontrado');
      }
      return encontrado;
    };

    botao().click();
    const voto = http.expectOne(`${environment.apiUrl}/ideias/2/votar`);
    expect(voto.request.method).toBe('PATCH');
    voto.flush(ideia(2, 'Ideia do Felipe', 'Felipe', 5));
    await componente().whenStable();
    expect(botao().textContent).toContain('▲ 5');
    expect(botao().getAttribute('aria-pressed')).toBe('true');

    botao().click();
    await componente().whenStable();
    http.expectNone(`${environment.apiUrl}/ideias/2/votar`);
    expect(botao().textContent).toContain('▲ 4');
    expect(botao().getAttribute('aria-pressed')).toBe('false');

    botao().click();
    await componente().whenStable();
    http.expectNone(`${environment.apiUrl}/ideias/2/votar`);
    expect(botao().textContent).toContain('▲ 5');
  });

  it('ignora o segundo clique enquanto o voto está sendo enviado', async () => {
    await carregar([ideia(2, 'Ideia do Felipe', 'Felipe')]);

    const botao = cartoes()[0].querySelector<HTMLButtonElement>('.votos');
    botao?.click();
    botao?.click();

    const votos = http.match(`${environment.apiUrl}/ideias/2/votar`);
    expect(votos.length).toBe(1);
    votos[0].flush(ideia(2, 'Ideia do Felipe', 'Felipe', 1));
    await componente().whenStable();
  });

  it('lembra o voto do usuário depois de recarregar', async () => {
    localStorage.setItem(
      environment.chaveVotos,
      JSON.stringify({ '1': { ativos: [2], contabilizados: [2, 3] } }),
    );

    await carregar([
      ideia(2, 'Votada', 'Felipe', 3),
      ideia(3, 'Desvotada', 'Ana', 3),
    ]);

    const votada = cartoes().find((c) => c.textContent?.includes('Votada'));
    const desvotada = cartoes().find((c) => c.textContent?.includes('Desvotada'));
    expect(votada?.querySelector('.votos')?.getAttribute('aria-pressed')).toBe('true');
    expect(votada?.querySelector('.votos')?.textContent).toContain('▲ 3');
    expect(desvotada?.querySelector('.votos')?.getAttribute('aria-pressed')).toBe('false');
    expect(desvotada?.querySelector('.votos')?.textContent).toContain('▲ 2');
  });

  it('filtra por autoria e ordena por votos', async () => {
    await carregar([
      ideia(1, 'Minha ideia', NOME, 1),
      ideia(2, 'Pouco votada', 'Felipe', 2),
      ideia(3, 'Muito votada', 'Ana', 9),
    ]);

    const autoria = elemento().querySelector<HTMLSelectElement>('#filtro-autoria');
    const ordem = elemento().querySelector<HTMLSelectElement>('#filtro-ordem');
    if (!autoria || !ordem) {
      throw new Error('Filtros não encontrados');
    }
    autoria.value = 'outras';
    autoria.dispatchEvent(new Event('change'));
    ordem.value = 'votadas';
    ordem.dispatchEvent(new Event('change'));
    await componente().whenStable();

    const titulos = cartoes().map((c) => c.querySelector('h3')?.textContent);
    expect(titulos).toEqual(['Muito votada', 'Pouco votada']);
  });

  it('calcula o resumo da busca', async () => {
    await carregar([
      ideia(1, 'Minha ideia', NOME, 3, 'processo'),
      ideia(2, 'Ideia do Felipe', 'Felipe', 1, 'produto'),
      ideia(3, 'Ideia da Ana', 'Ana', 0, 'produto'),
      ideia(4, 'Outra minha', NOME, 2, 'processo'),
    ]);

    const texto = elemento().querySelector('.resumo')?.textContent?.replace(/\s+/g, ' ') ?? '';
    expect(texto).toContain('4 ideias');
    expect(texto).toContain('6 votos · média 1.5');
    expect(texto).toContain('2 suas (50%) · 5 votos recebidos');
    expect(texto).toContain('Em alta: processo');
    expect(texto).toContain('Mais votada: Minha ideia');
  });

  it('envia o texto da busca para a API', async () => {
    await carregar([]);

    const campo = elemento().querySelector<HTMLInputElement>('#busca');
    if (!campo) {
      throw new Error('Campo de busca não encontrado');
    }
    campo.value = 'voz';
    campo.dispatchEvent(new Event('input'));

    const requisicao = await busca();
    expect(requisicao.request.params.get('q')).toBe('voz');
    requisicao.flush(envelope([ideia(5, 'Busca por voz', 'Felipe')]));
    await componente().whenStable();

    expect(cartoes().length).toBe(1);
  });

  it('mostra mensagem amigável quando a API falha', async () => {
    (await busca()).flush({ erro: 'ignorado' }, { status: 500, statusText: 'Server Error' });
    await componente().whenStable();

    const texto = elemento().textContent ?? '';
    expect(texto).toContain('Não foi possível carregar as ideias.');
    expect(texto).not.toContain('500');
  });
});
