import { Atleta } from '../models/atleta.model';
import { TimeResponse } from '../models/time.model';

/**
 * Mapeia um atleta no formato bruto da API (Cartola Odds) para o modelo `Atleta`
 * usado internamente pelo frontend.
 *
 * Centraliza as regras de normalização compartilhadas entre `/api/time` e
 * `/api/time/comparar`:
 *  - `nomeClube` → `clube`
 *  - sinônimos de metadados de score normalizados para `criterioScore`/`descricaoScore`
 *  - `status` (string "⚠️ Dúvida") → `emDuvida` (boolean)
 *  - `substitutoProvavel` mapeado recursivamente
 */
export function mapAtleta(raw: any): Atleta {
  return {
    apelido: raw.apelido,
    posicao: raw.posicao,
    clube: raw.nomeClube ?? raw.clube,
    mediaPontos: raw.mediaPontos,
    valorizacao: raw.valorizacao,
    preco: raw.preco,
    score: raw.score,
    criterioScore: raw.criterioScore ?? raw.scoreCriterio ?? raw.tipoScore ?? raw.estrategiaScore,
    descricaoScore: raw.descricaoScore ?? raw.scoreDescricao,
    pesosScore: raw.pesosScore,
    desvioPadrao: raw.desvioPadrao,
    rodadasConsideradas: raw.rodadasConsideradas,
    emDuvida: typeof raw.emDuvida === 'boolean' ? raw.emDuvida : (raw.status?.includes('Dúvida') ?? false),
    status: raw.status,
    substitutoProvavel: raw.substitutoProvavel ? mapAtleta(raw.substitutoProvavel) : undefined,
  };
}

/**
 * Mapeia a resposta bruta de um time (titulares/reservas agrupados por posição)
 * para o modelo `TimeResponse` com arrays planos.
 */
export function mapTimeResponse(raw: any): TimeResponse {
  const titulares: Atleta[] = Object.values((raw.titulares ?? {}) as Record<string, any[]>)
    .flat()
    .map(a => mapAtleta(a));

  const reservas: Atleta[] = Object.values((raw.reservas ?? {}) as Record<string, any>)
    .map(a => mapAtleta(a));

  return {
    titulares,
    reservas,
    capitao: raw.capitao ? mapAtleta(raw.capitao) : null,
    reservaLuxo: raw.reservaLuxo ? mapAtleta(raw.reservaLuxo) : null,
    alertasDuvida: raw.alertasDuvida ?? [],
    avisoMercado: raw.avisoMercado ?? null,
    rodada: raw.rodada,
    custoTotal: raw.custoTotal ?? 0,
    orcamentoInformado: raw.orcamentoInformado ?? null,
    saldoRestante: raw.saldoRestante ?? null,
    estrategia: raw.estrategia ?? 'SCORE_MAXIMO',
    formacaoCompleta: raw.formacaoCompleta ?? true,
    avisoOrcamento: raw.avisoOrcamento ?? null,
  };
}
