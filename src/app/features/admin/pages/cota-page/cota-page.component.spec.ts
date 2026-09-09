import { TestBed, ComponentFixture } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { CotaPageComponent } from './cota-page.component';
import { CotaService } from '../../services/cota.service';
import { CotaResponse, CotaHistoricoResponse, LeituraCota } from '../../../../shared/models/cota.model';

const cotaSaudavel: CotaResponse = {
  saldoRestante: 412,
  consumoMes: 88,
  ultimaLeitura: '2025-06-01T15:30:00',
  minRequestsRemaining: 50,
  guardrailAtivo: false,
  ultimaSondagem: null,
  proximaSondagem: null
};

const cotaSemLeitura: CotaResponse = {
  saldoRestante: null,
  consumoMes: null,
  ultimaLeitura: null,
  minRequestsRemaining: 50,
  guardrailAtivo: false,
  ultimaSondagem: null,
  proximaSondagem: null
};

const cotaGuardrailArmado: CotaResponse = {
  saldoRestante: 40,
  consumoMes: 460,
  ultimaLeitura: '2025-06-20T12:00:00',
  minRequestsRemaining: 50,
  guardrailAtivo: true,
  ultimaSondagem: '2025-06-20T12:00:00',
  proximaSondagem: '2025-06-20T18:00:00'
};

function leitura(instante: string, consumoMes: number | null, reinicioDeCota = false): LeituraCota {
  return { instante, saldoRestante: consumoMes == null ? null : 500 - consumoMes, consumoMes, reinicioDeCota };
}

const historicoVazio: CotaHistoricoResponse = { dias: 30, desde: '2025-05-02T00:00:00', total: 0, leituras: [] };

function historico(leituras: LeituraCota[]): CotaHistoricoResponse {
  return { dias: 30, desde: '2025-05-02T00:00:00', total: leituras.length, leituras };
}

describe('CotaPageComponent', () => {
  let fixture: ComponentFixture<CotaPageComponent>;
  let component: CotaPageComponent;
  let mockCotaService: jasmine.SpyObj<CotaService>;

  async function montar(cota: CotaResponse, hist: CotaHistoricoResponse = historicoVazio): Promise<void> {
    mockCotaService.getCota.and.returnValue(of(cota));
    mockCotaService.getHistorico.and.returnValue(of(hist));
    fixture = TestBed.createComponent(CotaPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  beforeEach(async () => {
    mockCotaService = jasmine.createSpyObj('CotaService', ['getCota', 'getHistorico']);
    mockCotaService.getCota.and.returnValue(of(cotaSaudavel));
    mockCotaService.getHistorico.and.returnValue(of(historicoVazio));

    await TestBed.configureTestingModule({
      imports: [CotaPageComponent],
      providers: [{ provide: CotaService, useValue: mockCotaService }]
    }).compileComponents();
  });

  it('should create', async () => {
    await montar(cotaSaudavel);
    expect(component).toBeTruthy();
  });

  it('should load the current state and the history on init', async () => {
    await montar(cotaSaudavel);
    expect(mockCotaService.getCota).toHaveBeenCalledTimes(1);
    expect(mockCotaService.getHistorico).toHaveBeenCalledWith(30);
    expect(component.cota).toEqual(cotaSaudavel);
  });

  it('should show balance, monthly usage and the margin to the configured minimum', async () => {
    await montar(cotaSaudavel);
    const texto = fixture.nativeElement.textContent;

    expect(texto).toContain('412');
    expect(texto).toContain('88');
    expect(texto).toContain('50');
    // 412 - 50: o que ainda pode ser gasto antes de o guardrail agir.
    expect(component.margemAteMinimo).toBe(362);
    expect(texto).toContain('362');
  });

  it('should derive the cycle quota and the balance percentage', async () => {
    await montar(cotaSaudavel);
    expect(component.cotaCiclo).toBe(500);
    expect(component.percentSaldo).toBeCloseTo(82.4, 1);
  });

  it('should say "sem leitura ainda" instead of zero when the fields are null', async () => {
    await montar(cotaSemLeitura);
    const texto = fixture.nativeElement.textContent;

    expect(texto).toContain('sem leitura ainda');
    expect(component.margemAteMinimo).toBeNull();
    expect(component.cotaCiclo).toBeNull();
    expect(component.percentSaldo).toBeNull();
    // Um "0" no lugar de "sem leitura" diria "cota esgotada" onde a informação é "não perguntamos".
    expect(fixture.nativeElement.querySelector('.campo-numero.sem-leitura')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.saldo-bar')).toBeNull();
  });

  it('should make the armed guardrail evident and show proximaSondagem', async () => {
    await montar(cotaGuardrailArmado);
    const texto = fixture.nativeElement.textContent;

    expect(fixture.nativeElement.querySelector('.guardrail-card.armado')).toBeTruthy();
    expect(texto).toContain('Guardrail armado');
    expect(texto).toContain('20/06/2025 18:00:00');
  });

  it('should show the guardrail as free when it is not armed', async () => {
    await montar(cotaSaudavel);
    expect(fixture.nativeElement.querySelector('.guardrail-card.armado')).toBeNull();
    expect(fixture.nativeElement.textContent).toContain('Guardrail livre');
  });

  it('should set error when the current state fails to load', async () => {
    mockCotaService.getCota.and.returnValue(throwError(() => ({ userMessage: 'Falhou.' })));
    fixture = TestBed.createComponent(CotaPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    expect(component.error).toBe('Falhou.');
    expect(mockCotaService.getHistorico).not.toHaveBeenCalled();
  });

  it('should keep the page usable when only the history fails', async () => {
    mockCotaService.getCota.and.returnValue(of(cotaSaudavel));
    mockCotaService.getHistorico.and.returnValue(throwError(() => ({ userMessage: 'Histórico indisponível.' })));
    fixture = TestBed.createComponent(CotaPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    expect(component.error).toBe('');
    expect(component.historicoError).toBe('Histórico indisponível.');
    expect(component.consumoPontos).toEqual([]);
    // Os sete campos do estado atual continuam na tela.
    expect(fixture.nativeElement.textContent).toContain('412');
  });

  it('should not draw the chart with fewer than two readings', async () => {
    await montar(cotaSaudavel, historico([leitura('2025-06-01T10:00:00', 10)]));
    expect(component.consumoSegmentos).toEqual([]);
    expect(fixture.nativeElement.querySelector('.consumo-chart')).toBeNull();
    expect(fixture.nativeElement.querySelector('.grafico-vazio')).toBeTruthy();
  });

  it('should draw the series in a single segment without a cycle renewal', async () => {
    await montar(cotaSaudavel, historico([
      leitura('2025-06-01T10:00:00', 10),
      leitura('2025-06-02T10:00:00', 30),
      leitura('2025-06-03T10:00:00', 60)
    ]));

    expect(component.consumoPontos.length).toBe(3);
    expect(component.consumoSegmentos.length).toBe(1);
    expect(component.reinicios).toEqual([]);
    expect(fixture.nativeElement.querySelectorAll('polyline.consumo-line').length).toBe(1);
  });

  it('should break the line at a cycle renewal instead of drawing a drop', async () => {
    await montar(cotaSaudavel, historico([
      leitura('2025-06-28T10:00:00', 400),
      leitura('2025-06-29T10:00:00', 460),
      leitura('2025-07-01T10:00:00', 5, true),
      leitura('2025-07-02T10:00:00', 20)
    ]));

    expect(component.consumoSegmentos.length).toBe(2);
    expect(component.reinicios.length).toBe(1);
    expect(fixture.nativeElement.querySelectorAll('polyline.consumo-line').length).toBe(2);
    expect(fixture.nativeElement.querySelectorAll('line.reinicio-line').length).toBe(1);
    // O rotulo saiu do SVG para nao ser esticado pelo preserveAspectRatio="none".
    const marca = fixture.nativeElement.querySelector('.chart-reinicio');
    expect(marca.textContent).toContain('renovação');
    expect(fixture.nativeElement.querySelector('svg text')).toBeNull();
    expect(fixture.nativeElement.textContent).toContain('1 renovação de cota');
    expect(fixture.nativeElement.textContent).not.toContain('renovação(ões)');
  });

  it('should ignore readings without consumoMes, which measured nothing', async () => {
    await montar(cotaSaudavel, historico([
      leitura('2025-06-01T10:00:00', 10),
      leitura('2025-06-02T10:00:00', null),
      leitura('2025-06-03T10:00:00', 60)
    ]));

    expect(component.consumoPontos.length).toBe(2);
    expect(component.consumoMaximo).toBe(60);
  });

  it('should scale the chart from zero so small variations are not exaggerated', async () => {
    await montar(cotaSaudavel, historico([
      leitura('2025-06-01T10:00:00', 50),
      leitura('2025-06-02T10:00:00', 100)
    ]));

    const [primeiro, ultimo] = component.consumoPontos;
    // Com a escala ancorada em zero, metade do máximo cai no meio da área útil (topo 16, base 118).
    expect(ultimo.y).toBe(16);
    expect(primeiro.y).toBe(67);
    expect(component.primeiroInstante).toBe('2025-06-01T10:00:00');
    expect(component.ultimoInstante).toBe('2025-06-02T10:00:00');
  });

  it('should space the points by time, not by position in the list', async () => {
    // Duas leituras coladas e uma três dias depois: espaçado por índice, o ponto do meio
    // cairia no centro do gráfico e o intervalo longo pareceria igual ao curto.
    await montar(cotaSaudavel, historico([
      leitura('2025-06-01T00:00:00', 10),
      leitura('2025-06-01T06:00:00', 20),
      leitura('2025-06-04T00:00:00', 60)
    ]));

    const [a, b, c] = component.consumoPontos;
    const util = 320 - 24 * 2;
    expect(a.x).toBe(24);
    // 6h de 72h = 1/12 da janela.
    expect(b.x).toBeCloseTo(24 + util / 12, 5);
    expect(c.x).toBe(24 + util);
    // percentX acompanha, para os rótulos HTML caírem sobre a linha.
    expect(a.percentX).toBeCloseTo((a.x / 320) * 100, 5);
  });

  it('should fall back to even spacing when every reading shares one instant', async () => {
    await montar(cotaSaudavel, historico([
      leitura('2025-06-01T10:00:00', 10),
      leitura('2025-06-01T10:00:00', 20),
      leitura('2025-06-01T10:00:00', 30)
    ]));

    const xs = component.consumoPontos.map((p) => p.x);
    expect(xs).toEqual([24, 160, 296]);
  });

  it('should summarise the chart in the aria-label instead of naming the figure', async () => {
    await montar(cotaSaudavel, historico([
      leitura('2025-06-28T10:00:00', 400),
      leitura('2025-07-01T10:00:00', 5, true),
      leitura('2025-07-02T10:00:00', 20)
    ]));

    const svg = fixture.nativeElement.querySelector('svg.consumo-chart');
    expect(svg.getAttribute('aria-label')).toBe(
      'Consumo de requisições em 3 leituras, de 400 a 20, com 1 renovação de cota'
    );
  });
});
