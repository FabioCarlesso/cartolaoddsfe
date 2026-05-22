export interface ConfiguracaoResponse {
  oddLimite: number;
  pesoMediaPontos: number;
  pesoValorizacao: number;
  pesoDesempenho: number;
  pesoFatorCasa: number;
  pesoTimeFavorito: number;
  pesoDesvio: number;
  formacaoGol: number;
  formacaoLat: number;
  formacaoZag: number;
  formacaoMei: number;
  formacaoAta: number;
  formacaoTec: number;
  updatedAt: string;
}

export interface ConfiguracaoRequest {
  oddLimite?: number;
  pesoMediaPontos?: number;
  pesoValorizacao?: number;
  pesoDesempenho?: number;
  pesoFatorCasa?: number;
  pesoTimeFavorito?: number;
  pesoDesvio?: number;
  formacaoGol?: number;
  formacaoLat?: number;
  formacaoZag?: number;
  formacaoMei?: number;
  formacaoAta?: number;
  formacaoTec?: number;
}

export interface CacheResponse {
  cachesInvalidados: string[];
  mensagem: string;
  timestamp: string;
}
