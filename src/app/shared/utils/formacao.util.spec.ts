import {
  FORMACOES_DISPONIVEIS,
  MAX_FORMACOES,
  MIN_FORMACOES,
  composicaoEsperada,
  formacaoParaConfig,
  validarComposicao,
} from './formacao.util';

/** Gera uma lista de titulares com a contagem informada por posição. */
const titulares = (contagem: Record<string, number>): { posicao: string }[] => {
  const lista: { posicao: string }[] = [];
  for (const [pos, qtd] of Object.entries(contagem)) {
    for (let i = 0; i < qtd; i++) lista.push({ posicao: pos });
  }
  return lista;
};

const composicaoExata = (formacao: string): Record<string, number> => {
  const e = composicaoEsperada(formacao);
  return { GOL: e.GOL, LAT: e.LAT, ZAG: e.ZAG, MEI: e.MEI, ATA: e.ATA, TEC: e.TEC };
};

describe('formacao.util', () => {
  it('should expose the valid Cartola formations', () => {
    expect(FORMACOES_DISPONIVEIS).toEqual(['4-3-3', '3-4-3', '4-4-2', '5-3-2', '4-5-1', '3-5-2']);
  });

  it('should define selection bounds of 2 and 5', () => {
    expect(MIN_FORMACOES).toBe(2);
    expect(MAX_FORMACOES).toBe(5);
  });

  describe('formacaoParaConfig', () => {
    it('should convert 4-3-3 fixing GOL=1, LAT=2 and TEC=1', () => {
      expect(formacaoParaConfig('4-3-3')).toEqual({
        formacaoGol: 1,
        formacaoLat: 2,
        formacaoZag: 2,
        formacaoMei: 3,
        formacaoAta: 3,
        formacaoTec: 1,
      });
    });

    it('should derive zagueiros as DEF minus laterais for 3-4-3', () => {
      expect(formacaoParaConfig('3-4-3')).toEqual({
        formacaoGol: 1,
        formacaoLat: 2,
        formacaoZag: 1,
        formacaoMei: 4,
        formacaoAta: 3,
        formacaoTec: 1,
      });
    });

    it('should convert 5-3-2 with three zagueiros', () => {
      const config = formacaoParaConfig('5-3-2');
      expect(config.formacaoZag).toBe(3);
      expect(config.formacaoMei).toBe(3);
      expect(config.formacaoAta).toBe(2);
    });

    it('should keep 11 outfield-plus-goalkeeper players for every valid formation', () => {
      for (const f of FORMACOES_DISPONIVEIS) {
        const c = formacaoParaConfig(f);
        const total =
          c.formacaoGol! + c.formacaoLat! + c.formacaoZag! + c.formacaoMei! + c.formacaoAta!;
        expect(total).withContext(f).toBe(11);
      }
    });

    it('should throw on malformed strings', () => {
      expect(() => formacaoParaConfig('4-3')).toThrowError(/inválida/);
      expect(() => formacaoParaConfig('abc')).toThrowError(/inválida/);
    });

    it('should throw when the formation has fewer than one zagueiro', () => {
      // 2 defensores - 2 laterais = 0 zagueiros → inválido
      expect(() => formacaoParaConfig('2-4-4')).toThrowError(/inválida/);
    });
  });

  describe('composicaoEsperada', () => {
    it('should derive the expected per-position composition for 4-3-3', () => {
      expect(composicaoEsperada('4-3-3')).toEqual({
        GOL: 1,
        LAT: 2,
        ZAG: 2,
        MEI: 3,
        ATA: 3,
        TEC: 1,
      });
    });

    it('should total 12 starters (11 in field + técnico) for every valid formation', () => {
      for (const f of FORMACOES_DISPONIVEIS) {
        const c = composicaoEsperada(f);
        const total = c.GOL + c.LAT + c.ZAG + c.MEI + c.ATA + c.TEC;
        expect(total).withContext(f).toBe(12);
      }
    });
  });

  describe('validarComposicao', () => {
    it('should return null when the composition matches every valid formation', () => {
      for (const f of FORMACOES_DISPONIVEIS) {
        expect(validarComposicao(f, titulares(composicaoExata(f)))).withContext(f).toBeNull();
      }
    });

    it('should flag the inflated defenders regression of cartolaoddsapi#31', () => {
      // 4-3-3 esperado ZAG=2; backend devolve ZAG=4 e 14 titulares.
      const aviso = validarComposicao(
        '4-3-3',
        titulares({ GOL: 1, LAT: 2, ZAG: 4, MEI: 3, ATA: 3, TEC: 1 }),
      );
      expect(aviso).toContain('4-3-3');
      expect(aviso).toContain('ZAG 4 (esperado 2)');
    });

    it('should list every divergent position', () => {
      const aviso = validarComposicao(
        '4-3-3',
        titulares({ GOL: 1, LAT: 2, ZAG: 2, MEI: 4, ATA: 4, TEC: 1 }),
      );
      expect(aviso).toContain('MEI 4 (esperado 3)');
      expect(aviso).toContain('ATA 4 (esperado 3)');
    });

    it('should report a missing position as a zero count', () => {
      const aviso = validarComposicao(
        '4-3-3',
        titulares({ GOL: 1, LAT: 2, ZAG: 2, MEI: 3, ATA: 3 }),
      );
      expect(aviso).toContain('TEC 0 (esperado 1)');
    });

    it('should ignore titulares without a posicao', () => {
      const lista = [...titulares(composicaoExata('4-3-3')), { posicao: undefined } as any];
      expect(validarComposicao('4-3-3', lista)).toBeNull();
    });

    it('should degrade gracefully and return null for an unknown formation', () => {
      expect(validarComposicao('abc', titulares({ ATA: 1 }))).toBeNull();
    });
  });
});
