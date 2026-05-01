import { Atleta } from '../models/atleta.model';

const SCORE_FALLBACK_BY_POSITION: Record<string, string> = {
  GOL: 'Critério defensivo da posição',
  ATA: 'Critério ofensivo da posição'
};

export function getScoreCriteriaLabel(atleta: Atleta): string {
  return atleta.criterioScore
    ?? atleta.scoreCriterio
    ?? atleta.tipoScore
    ?? atleta.estrategiaScore
    ?? SCORE_FALLBACK_BY_POSITION[atleta.posicao]
    ?? 'Critério padrão da API';
}

export function getScoreDescription(atleta: Atleta): string | null {
  return atleta.descricaoScore ?? atleta.scoreDescricao ?? null;
}

export function getScorePercent(score: number): number {
  return Math.min(((score ?? 0) / 12) * 100, 100);
}
