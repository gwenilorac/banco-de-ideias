export interface Usuario {
  readonly id: number;
  readonly nome: string;
  readonly email: string;
  readonly criadoEm: string;
  readonly atualizadoEm: string;
}

export interface CadastroInput {
  readonly nome: string;
  readonly email: string;
  readonly senha: string;
}

export interface LoginInput {
  readonly email: string;
  readonly senha: string;
}

export interface Autenticacao {
  readonly usuario: Usuario;
  readonly token: string;
}

function ehRegistro(valor: unknown): valor is Record<string, unknown> {
  return typeof valor === 'object' && valor !== null && !Array.isArray(valor);
}

export function ehUsuario(valor: unknown): valor is Usuario {
  if (!ehRegistro(valor)) {
    return false;
  }

  return (
    typeof valor['id'] === 'number' &&
    typeof valor['nome'] === 'string' &&
    typeof valor['email'] === 'string' &&
    typeof valor['criadoEm'] === 'string' &&
    typeof valor['atualizadoEm'] === 'string'
  );
}

export function ehAutenticacao(valor: unknown): valor is Autenticacao {
  return ehRegistro(valor) && typeof valor['token'] === 'string' && ehUsuario(valor['usuario']);
}
