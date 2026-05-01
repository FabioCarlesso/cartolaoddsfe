export interface Atleta {
  apelido: string;
  posicao: string;
  clube?: string;
  mediaPontos: number;
  valorizacao: number;
  preco: number;
  score: number;
  criterioScore?: string;
  scoreCriterio?: string;
  tipoScore?: string;
  estrategiaScore?: string;
  descricaoScore?: string;
  scoreDescricao?: string;
  pesosScore?: Record<string, number> | Array<{ nome: string; peso: number; descricao?: string }>;
  emDuvida: boolean;
  status?: string;
  substitutoProvavel?: Atleta;
}
