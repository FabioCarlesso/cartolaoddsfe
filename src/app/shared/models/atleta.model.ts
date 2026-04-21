export interface Atleta {
  apelido: string;
  posicao: string;
  clube?: string;
  mediaPontos: number;
  valorizacao: number;
  preco: number;
  score: number;
  emDuvida: boolean;
  status?: string;
  substitutoProvavel?: Atleta;
}
