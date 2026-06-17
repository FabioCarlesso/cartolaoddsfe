import {
  FORMACOES_DISPONIVEIS,
  MAX_FORMACOES,
  MIN_FORMACOES,
  formacaoParaConfig,
} from './formacao.util';

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
});
