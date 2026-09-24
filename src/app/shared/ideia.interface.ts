export interface Ideia {
  readonly id: number;
  readonly ideia: string;
  readonly resolve: string;
  readonly autor: string;
  readonly categoria: string | null;
  readonly votos: number;
  readonly criadoEm: string;
  readonly atualizadoEm: string;
}

export interface IdeiaInput {
  readonly ideia: string;
  readonly resolve: string;
  readonly autor?: string;
  readonly categoria?: string;
}

export interface ListaDeIdeias {
  readonly total: number;
  readonly pagina: number;
  readonly limite: number;
  readonly paginas: number;
  readonly dados: readonly Ideia[];
}

export interface FiltroIdeias {
  readonly q?: string;
  readonly categoria?: string;
  readonly pagina?: number;
  readonly limite?: number;
}

export type Autoria = 'todas' | 'minhas' | 'outras';

export type Ordenacao = 'recentes' | 'antigas' | 'votadas';

export interface FiltrosBusca {
  readonly texto: string;
  readonly categoria: string;
  readonly autoria: Autoria;
  readonly ordem: Ordenacao;
}

export const FILTROS_PADRAO: FiltrosBusca = {
  texto: '',
  categoria: '',
  autoria: 'todas',
  ordem: 'recentes',
};
