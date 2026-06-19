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

/** Composição de titulares esperada por posição para uma formação. */
export interface ComposicaoEsperada {
  GOL: number;
  LAT: number;
  ZAG: number;
  MEI: number;
  ATA: number;
  TEC: number;
}

/**
 * Deriva a composição de titulares esperada para uma formação, reaproveitando
 * a mesma regra do `formacaoParaConfig` (GOL=1, LAT=2, ZAG=DEF−2, TEC=1).
 *
 * @throws {Error} se a formação for inválida (propagado de `formacaoParaConfig`).
 */
export function composicaoEsperada(formacao: string): ComposicaoEsperada {
  const cfg = formacaoParaConfig(formacao);
  return {
    GOL: cfg.formacaoGol!,
    LAT: cfg.formacaoLat!,
    ZAG: cfg.formacaoZag!,
    MEI: cfg.formacaoMei!,
    ATA: cfg.formacaoAta!,
    TEC: cfg.formacaoTec!,
  };
}

/**
 * Grupos comparados pela salvaguarda de composição, na ordem de exibição.
 * Laterais e zagueiros são agrupados em `DEF`: a formação é definida pelo total
 * de defensores (`DEF-MEI-ATA`), então uma variação legítima do split LAT/ZAG
 * (com o total correto) não deve gerar aviso — só a inflação do total importa.
 */
const GRUPOS = ['GOL', 'DEF', 'MEI', 'ATA', 'TEC'] as const;
type Grupo = (typeof GRUPOS)[number];

/** Mapeia cada posição da API para o grupo correspondente. */
const POSICAO_GRUPO: Record<string, Grupo> = {
  GOL: 'GOL',
  LAT: 'DEF',
  ZAG: 'DEF',
  MEI: 'MEI',
  ATA: 'ATA',
  TEC: 'TEC',
};

/**
 * Salvaguarda defensiva (ver cartolaoddsapi#31): compara a contagem de titulares
 * retornada pelo backend com a composição esperada da `formacao`, agrupando
 * laterais e zagueiros no total de defensores (`DEF`).
 *
 * O frontend renderiza fielmente o que recebe; quando a composição diverge da
 * formação selecionada, o preview pode não corresponder ao que será efetivamente
 * aplicado em "Usar esta formação". Esta função produz a mensagem de aviso nesse
 * caso, incluindo posições não reconhecidas eventualmente retornadas.
 *
 * @returns mensagem descritiva quando há divergência; `null` quando a composição
 *   confere ou quando a formação não é reconhecida (degradação graciosa).
 */
export function validarComposicao(
  formacao: string,
  titulares: { posicao?: string }[],
): string | null {
  let esperadaPosicao: ComposicaoEsperada;
  try {
    esperadaPosicao = composicaoEsperada(formacao);
  } catch {
    return null;
  }

  const esperada: Record<Grupo, number> = {
    GOL: esperadaPosicao.GOL,
    DEF: esperadaPosicao.LAT + esperadaPosicao.ZAG,
    MEI: esperadaPosicao.MEI,
    ATA: esperadaPosicao.ATA,
    TEC: esperadaPosicao.TEC,
  };

  const contagem: Record<Grupo, number> = { GOL: 0, DEF: 0, MEI: 0, ATA: 0, TEC: 0 };
  const posicoesDesconhecidas = new Set<string>();
  for (const t of titulares) {
    const pos = t.posicao;
    if (!pos) {
      continue;
    }
    const grupo = POSICAO_GRUPO[pos];
    if (grupo) {
      contagem[grupo] += 1;
    } else {
      posicoesDesconhecidas.add(pos);
    }
  }

  const divergencias = GRUPOS.filter((g) => contagem[g] !== esperada[g]).map(
    (g) => `${g} ${contagem[g]} (esperado ${esperada[g]})`,
  );
  for (const pos of posicoesDesconhecidas) {
    divergencias.push(`posição não reconhecida: ${pos}`);
  }

  if (divergencias.length === 0) {
    return null;
  }

  return `Composição divergente da formação ${formacao}: ${divergencias.join(', ')}. O preview pode não corresponder ao que será aplicado.`;
}
