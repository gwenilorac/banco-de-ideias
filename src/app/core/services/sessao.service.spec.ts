import { TestBed } from '@angular/core/testing';

import { environment } from '@env/environment';
import { SessaoService } from '@core/services/sessao.service';
import { Autenticacao } from '@shared/usuario.interface';

const SESSAO: Autenticacao = {
  token: 'token-de-teste',
  usuario: {
    id: 7,
    nome: 'Caroline',
    email: 'caroline@exemplo.com',
    criadoEm: '2026-09-14T00:00:00.000Z',
    atualizadoEm: '2026-09-14T00:00:00.000Z',
  },
};

function criar(): SessaoService {
  TestBed.resetTestingModule();
  return TestBed.inject(SessaoService);
}

describe('SessaoService', () => {
  beforeEach(() => localStorage.clear());

  it('começa sem sessão quando não há nada salvo', () => {
    const sessao = criar();
    expect(sessao.estaAutenticado()).toBe(false);
    expect(sessao.usuario()).toBeNull();
    expect(sessao.token()).toBeNull();
  });

  it('guarda o token no LocalStorage ao iniciar a sessão', () => {
    const sessao = criar();
    sessao.iniciar(SESSAO);

    expect(sessao.estaAutenticado()).toBe(true);
    expect(sessao.token()).toBe('token-de-teste');
    expect(sessao.nomeDoAutor()).toBe('Caroline');
    expect(JSON.parse(localStorage.getItem(environment.chaveSessao) ?? 'null')).toEqual(SESSAO);
  });

  it('restaura a sessão salva ao recarregar a página', () => {
    localStorage.setItem(environment.chaveSessao, JSON.stringify(SESSAO));

    const sessao = criar();
    expect(sessao.estaAutenticado()).toBe(true);
    expect(sessao.usuario()?.nome).toBe('Caroline');
  });

  it('ignora sessão corrompida em vez de quebrar', () => {
    localStorage.setItem(environment.chaveSessao, '{ isso não é json');
    expect(criar().estaAutenticado()).toBe(false);
  });

  it('ignora sessão fora do formato esperado', () => {
    localStorage.setItem(environment.chaveSessao, JSON.stringify({ token: 123, usuario: {} }));
    expect(criar().estaAutenticado()).toBe(false);
  });

  it('apaga o token do LocalStorage ao encerrar', () => {
    const sessao = criar();
    sessao.iniciar(SESSAO);
    sessao.encerrar();

    expect(sessao.estaAutenticado()).toBe(false);
    expect(localStorage.getItem(environment.chaveSessao)).toBeNull();
  });
});
