import { FormControl, FormGroup } from '@angular/forms';

import { ERRO_SENHAS_DIFERENTES, senhasIguais } from '@shared/validadores/senhas-iguais.validator';

function grupo(senha: string, confirmacao: string): FormGroup {
  return new FormGroup(
    {
      senha: new FormControl(senha, { nonNullable: true }),
      confirmacao: new FormControl(confirmacao, { nonNullable: true }),
    },
    { validators: senhasIguais('senha', 'confirmacao') },
  );
}

describe('senhasIguais', () => {
  it('aceita senhas idênticas', () => {
    expect(grupo('senha12345', 'senha12345').hasError(ERRO_SENHAS_DIFERENTES)).toBe(false);
  });

  it('rejeita senhas diferentes', () => {
    expect(grupo('senha12345', 'senha12346').hasError(ERRO_SENHAS_DIFERENTES)).toBe(true);
  });

  it('é estrito com maiúsculas e espaços', () => {
    expect(grupo('Senha12345', 'senha12345').hasError(ERRO_SENHAS_DIFERENTES)).toBe(true);
    expect(grupo('senha12345', 'senha12345 ').hasError(ERRO_SENHAS_DIFERENTES)).toBe(true);
  });

  it('deixa a confirmação vazia para o validador required', () => {
    expect(grupo('senha12345', '').hasError(ERRO_SENHAS_DIFERENTES)).toBe(false);
  });
});
