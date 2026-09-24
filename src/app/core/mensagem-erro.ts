import { HttpErrorResponse } from '@angular/common/http';

export function mensagemDeErro(erro: HttpErrorResponse, padrao: string): string {
  if (erro.status < 400 || erro.status >= 500) {
    return padrao;
  }

  const corpo: unknown = erro.error;
  if (typeof corpo !== 'object' || corpo === null) {
    return padrao;
  }

  const texto: unknown = (corpo as Record<string, unknown>)['erro'];
  return typeof texto === 'string' && texto.trim().length > 0 ? texto : padrao;
}

export function detalhesDeValidacao(erro: HttpErrorResponse): string | null {
  const corpo: unknown = erro.error;
  if (typeof corpo !== 'object' || corpo === null) {
    return null;
  }

  const detalhes: unknown = (corpo as Record<string, unknown>)['detalhes'];
  if (!Array.isArray(detalhes)) {
    return null;
  }

  const textos = detalhes.filter((d): d is string => typeof d === 'string');
  return textos.length > 0 ? textos.join(' ') : null;
}
