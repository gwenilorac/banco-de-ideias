import { AbstractControl } from '@angular/forms';

export interface RegrasCampo {
  readonly rotulo: string;
  readonly minimo?: number;
  readonly maximo?: number;
}

export function mensagemDoCampo(
  controle: AbstractControl,
  regras: RegrasCampo,
  mostrarSempre = false,
): string | null {
  if (!controle.touched && !mostrarSempre) {
    return null;
  }
  if (controle.hasError('required')) {
    return `${regras.rotulo} é obrigatório.`;
  }
  if (controle.hasError('email')) {
    return 'Informe um e-mail válido.';
  }
  if (controle.hasError('minlength')) {
    return `${regras.rotulo} precisa de pelo menos ${regras.minimo} caracteres.`;
  }
  if (controle.hasError('maxlength')) {
    return `${regras.rotulo} deve ter no máximo ${regras.maximo} caracteres.`;
  }

  return null;
}
