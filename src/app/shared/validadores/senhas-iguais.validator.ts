import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export const ERRO_SENHAS_DIFERENTES = 'senhasDiferentes';

export function senhasIguais(campoSenha: string, campoConfirmacao: string): ValidatorFn {
  return (grupo: AbstractControl): ValidationErrors | null => {
    const senha: unknown = grupo.get(campoSenha)?.value;
    const confirmacao: unknown = grupo.get(campoConfirmacao)?.value;

    if (typeof senha !== 'string' || typeof confirmacao !== 'string' || confirmacao.length === 0) {
      return null;
    }

    return senha === confirmacao ? null : { [ERRO_SENHAS_DIFERENTES]: true };
  };
}
