import { ConfiguracaoRequest } from '../models/configuracao.model';

/**
 * Formações válidas para o Cartola FC, expostas como chips na tela de comparação.
 * Cada string segue o padrão `DEF-MEI-ATA`, onde DEF é o total de defensores
 * (laterais + zagueiros). GOL e TEC são sempre 1.
 */
export const FORMACOES_DISPONIVEIS = ['4-3-3', '3-4-3', '4-4-2', '5-3-2', '4-5-1', '3-5-2'] as const;

export type Formacao = (typeof FORMACOES_DISPONIVEIS)[number];

/** Limites de seleção na tela de comparação. */
export const MIN_FORMACOES = 2;
export const MAX_FORMACOES = 5;

/** Número fixo de laterais na escalação do Cartola FC. */
const LATERAIS_FIXOS = 2;

/**
 * Converte uma formação no padrão `DEF-MEI-ATA` (ex.: "4-3-3") para o corpo do
 * `PATCH /api/config`. O Cartola FC fixa GOL=1, LAT=2 e TEC=1; os zagueiros são
 * derivados do total de defensores (`DEF - LAT`).
 *
 * @throws {Error} se a string não tiver o formato esperado ou gerar valores inválidos.
 */
export function formacaoParaConfig(formacao: string): ConfiguracaoRequest {
  const partes = formacao.split('-').map((n) => Number(n));
  if (partes.length !== 3 || partes.some((n) => !Number.isInteger(n) || n < 0)) {
    throw new Error(`Formação inválida: ${formacao}`);
  }

  const [def, mei, ata] = partes;
  const zag = def - LATERAIS_FIXOS;
  if (zag < 1 || mei < 1 || ata < 1) {
    throw new Error(`Formação inválida: ${formacao}`);
  }

  return {
    formacaoGol: 1,
    formacaoLat: LATERAIS_FIXOS,
    formacaoZag: zag,
    formacaoMei: mei,
    formacaoAta: ata,
    formacaoTec: 1,
  };
}
