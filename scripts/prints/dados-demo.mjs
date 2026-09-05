// Dados fictícios para as capturas da landing. Nenhuma chamada à Odds API, nenhuma rodada real.

const clubes = ['Palmeiras', 'Flamengo', 'Botafogo', 'Internacional', 'Cruzeiro', 'Bahia', 'São Paulo', 'Fortaleza', 'Grêmio', 'Atlético-MG'];

function atleta(apelido, posicao, clube, preco, media, score, desvio, extras = {}) {
  return {
    apelido,
    posicao,
    nomeClube: clube,
    mediaPontos: media,
    valorizacao: Number((score - 5).toFixed(2)),
    preco,
    score,
    desvioPadrao: desvio,
    rodadasConsideradas: 5,
    ...extras
  };
}

export const pool = {
  GOL: [
    atleta('Vitorino', 'GOL', clubes[0], 12.4, 6.8, 8.9, 1.6),
    atleta('Delmar', 'GOL', clubes[2], 10.1, 6.1, 7.7, 2.2),
    atleta('Ubiratã', 'GOL', clubes[4], 8.9, 5.4, 6.9, 3.1)
  ],
  LAT: [
    atleta('Juninho Costa', 'LAT', clubes[0], 11.8, 6.4, 8.6, 1.9),
    atleta('Wagninho', 'LAT', clubes[1], 10.9, 5.9, 8.1, 2.4),
    atleta('Tarcísio', 'LAT', clubes[3], 9.2, 5.2, 7.2, 2.8),
    atleta('Elias Ramos', 'LAT', clubes[5], 8.4, 4.8, 6.6, 3.4)
  ],
  ZAG: [
    atleta('Bruno Alencar', 'ZAG', clubes[2], 10.6, 6.0, 8.4, 1.4),
    atleta('Rogerião', 'ZAG', clubes[0], 9.8, 5.6, 7.9, 1.8),
    atleta('Tiago Peçanha', 'ZAG', clubes[4], 8.7, 5.1, 7.1, 2.6),
    atleta('Nivaldo', 'ZAG', clubes[6], 7.9, 4.6, 6.4, 3.2)
  ],
  MEI: [
    atleta('Kauan Feitosa', 'MEI', clubes[1], 15.7, 8.2, 10.4, 2.1),
    atleta('Léo Barreto', 'MEI', clubes[0], 13.9, 7.4, 9.6, 2.5),
    atleta('Marcelinho', 'MEI', clubes[3], 12.2, 6.9, 8.8, 3.6, { status: '⚠️ Dúvida', substitutoProvavel: atleta('Renan Lisboa', 'MEI', clubes[3], 6.4, 4.1, 6.2, 2.9) }),
    atleta('Danilo Prata', 'MEI', clubes[5], 11.1, 6.3, 8.2, 2.2),
    atleta('Igor Sampaio', 'MEI', clubes[7], 9.6, 5.7, 7.4, 4.3)
  ],
  ATA: [
    atleta('Gabriel Torres', 'ATA', clubes[0], 18.3, 9.1, 11.2, 2.7),
    atleta('Wesley Nunes', 'ATA', clubes[1], 16.4, 8.4, 10.6, 3.3),
    atleta('Cauã Ferreira', 'ATA', clubes[2], 14.8, 7.6, 9.7, 2.0),
    atleta('Ítalo Mendes', 'ATA', clubes[8], 12.5, 6.8, 8.5, 4.6)
  ],
  TEC: [
    atleta('Aurélio Vasques', 'TEC', clubes[0], 7.2, 5.5, 7.6, 1.7),
    atleta('Mário Sarmento', 'TEC', clubes[2], 6.1, 4.9, 6.8, 2.3)
  ]
};

/** Monta um time no formato bruto da API a partir de uma composição por posição. */
export function montarTime(composicao, rodada = 12, orcamento = null) {
  const titulares = {};
  for (const [posicao, quantidade] of Object.entries(composicao)) {
    titulares[posicao] = pool[posicao].slice(0, quantidade);
  }

  const planos = Object.values(titulares).flat();
  const capitao = [...planos].sort((a, b) => b.score - a.score)[0];
  const custoTotal = Number(planos.reduce((total, a) => total + a.preco, 0).toFixed(2));

  const reservas = {
    GOL: pool.GOL[pool.GOL.length - 1],
    DEF: pool.ZAG[pool.ZAG.length - 1],
    MEI: pool.MEI[pool.MEI.length - 1],
    ATA: pool.ATA[pool.ATA.length - 1]
  };
  const reservaLuxo = Object.values(reservas).sort((a, b) => b.score - a.score)[0];

  return {
    rodada,
    titulares,
    reservas,
    capitao,
    reservaLuxo,
    custoTotal,
    orcamentoInformado: orcamento,
    saldoRestante: orcamento == null ? null : Number((orcamento - custoTotal).toFixed(2)),
    estrategia: 'SCORE_MAXIMO',
    formacaoCompleta: true,
    alertasDuvida: ['Marcelinho (Internacional) está em dúvida — substituto provável: Renan Lisboa.'],
    avisoMercado: null,
    avisoOrcamento: null
  };
}

const COMPOSICOES = {
  '4-3-3': { GOL: 1, LAT: 2, ZAG: 2, MEI: 3, ATA: 3, TEC: 1 },
  '3-4-3': { GOL: 1, LAT: 2, ZAG: 1, MEI: 4, ATA: 3, TEC: 1 },
  '4-4-2': { GOL: 1, LAT: 2, ZAG: 2, MEI: 4, ATA: 2, TEC: 1 },
  '5-3-2': { GOL: 1, LAT: 2, ZAG: 3, MEI: 3, ATA: 2, TEC: 1 },
  '4-5-1': { GOL: 1, LAT: 2, ZAG: 2, MEI: 5, ATA: 1, TEC: 1 },
  '3-5-2': { GOL: 1, LAT: 2, ZAG: 1, MEI: 5, ATA: 2, TEC: 1 }
};

export function comparar(formacoes) {
  const resultados = formacoes.map((formacao) => {
    const time = montarTime(COMPOSICOES[formacao]);
    const scoreTotal = Number(
      Object.values(time.titulares).flat().reduce((total, a) => total + a.score, 0).toFixed(2)
    );
    return { formacao, scoreTotal, custoTotal: time.custoTotal, time };
  });

  resultados.sort((a, b) => b.scoreTotal - a.scoreTotal);
  return { melhorFormacao: resultados[0].formacao, resultados };
}

export function ranking(limite = 25) {
  const atletas = Object.values(pool)
    .flat()
    .map(({ nomeClube, ...resto }) => ({
      ...resto,
      clube: nomeClube,
      emDuvida: typeof resto.status === 'string' && resto.status.includes('Dúvida')
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limite);

  return { atletas, rodada: 12, avisoMercado: null };
}

export function historico() {
  const rodadas = [
    { rodadaId: 12, scoreSugeridoTotal: 108.4, pontuacaoRealTotal: 96.7 },
    { rodadaId: 11, scoreSugeridoTotal: 104.9, pontuacaoRealTotal: 112.3 },
    { rodadaId: 10, scoreSugeridoTotal: 101.2, pontuacaoRealTotal: 88.4 },
    { rodadaId: 9, scoreSugeridoTotal: 99.8, pontuacaoRealTotal: 105.1 },
    { rodadaId: 8, scoreSugeridoTotal: 97.5, pontuacaoRealTotal: 91.9 }
  ].map((r, i) => ({
    ...r,
    criadoEm: new Date(Date.UTC(2026, 4, 20 - i * 7, 12, 0, 0)).toISOString(),
    totalAtletas: 12,
    pontuacaoRealDisponivel: true
  }));

  return { totalRodadas: rodadas.length, rodadas };
}
