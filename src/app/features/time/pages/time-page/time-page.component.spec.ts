import { TestBed, ComponentFixture, fakeAsync, tick } from '@angular/core/testing';
import { Observable, of, throwError } from 'rxjs';
import { TimePageComponent } from './time-page.component';
import { TimeService } from '../../services/time.service';
import { TimeResponse } from '../../../../shared/models/time.model';
import { Atleta } from '../../../../shared/models/atleta.model';

const makeAtleta = (overrides: Partial<Atleta>): Atleta => ({
  apelido: 'Atleta',
  posicao: 'MEI',
  clube: 'Time (TIM)',
  mediaPontos: 5.0,
  valorizacao: 0.5,
  preco: 10.0,
  score: 6.0,
  emDuvida: false,
  ...overrides
});

const mockTime: TimeResponse = {
  titulares: [
    makeAtleta({ apelido: 'Santos', posicao: 'GOL', score: 5.5, preco: 8.0 }),
    makeAtleta({ apelido: 'Rodinei', posicao: 'LAT', score: 5.0, preco: 6.0 }),
    makeAtleta({ apelido: 'Alex Sandro', posicao: 'LAT', score: 4.8, preco: 5.5 }),
    makeAtleta({ apelido: 'David Luiz', posicao: 'ZAG', score: 6.0, preco: 9.0 }),
    makeAtleta({ apelido: 'Léo Pereira', posicao: 'ZAG', score: 5.8, preco: 8.5 }),
    makeAtleta({ apelido: 'Arrascaeta', posicao: 'MEI', score: 9.5, preco: 18.0 }),
    makeAtleta({ apelido: 'Gerson', posicao: 'MEI', score: 8.0, preco: 14.0 }),
    makeAtleta({ apelido: 'Everton', posicao: 'MEI', score: 7.5, preco: 12.0 }),
    makeAtleta({ apelido: 'Gabigol', posicao: 'ATA', score: 10.0, preco: 20.0 }),
    makeAtleta({ apelido: 'Pedro', posicao: 'ATA', score: 9.5, preco: 19.0 }),
    makeAtleta({ apelido: 'Bruno Henrique', posicao: 'ATA', score: 8.8, preco: 17.0 }),
    makeAtleta({ apelido: 'Tite', posicao: 'TEC', score: 5.0, preco: 5.0 })
  ],
  reservas: [makeAtleta({ apelido: 'Reserva1', posicao: 'MEI', score: 5.0, preco: 9.0 })],
  capitao: makeAtleta({ apelido: 'Gabigol', posicao: 'ATA', score: 10.0, preco: 20.0 }),
  reservaLuxo: makeAtleta({ apelido: 'Reserva1', posicao: 'MEI', score: 5.0, preco: 9.0 }),
  alertasDuvida: [],
  avisoMercado: null,
  rodada: 15,
  custoTotal: 142.0,
  orcamentoInformado: null,
  saldoRestante: null,
  estrategia: 'SCORE_MAXIMO',
  formacaoCompleta: true,
  avisoOrcamento: null
};

describe('TimePageComponent', () => {
  let fixture: ComponentFixture<TimePageComponent>;
  let component: TimePageComponent;
  let mockTimeService: jasmine.SpyObj<TimeService>;

  beforeEach(async () => {
    mockTimeService = jasmine.createSpyObj('TimeService', ['getTime']);
    mockTimeService.getTime.and.returnValue(of(mockTime));

    await TestBed.configureTestingModule({
      imports: [TimePageComponent],
      providers: [{ provide: TimeService, useValue: mockTimeService }]
    }).compileComponents();

    fixture = TestBed.createComponent(TimePageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should call getTime on init', () => {
    expect(mockTimeService.getTime).toHaveBeenCalledTimes(1);
  });

  it('should set time data after successful load', () => {
    expect(component.time).toEqual(mockTime);
  });

  it('should set loading to false after load', () => {
    expect(component.loading).toBeFalse();
  });

  it('should set error to empty string after success', () => {
    expect(component.error).toBe('');
  });

  it('should set loading to true while loading', fakeAsync(() => {
    mockTimeService.getTime.and.returnValue(
      new Observable((observer: any) => { setTimeout(() => observer.next(mockTime), 100); })
    );
    component.load();
    expect(component.loading).toBeTrue();
    tick(100);
  }));

  it('should set error message on HTTP failure', () => {
    mockTimeService.getTime.and.returnValue(
      throwError(() => ({ userMessage: 'Erro de conexão.' }))
    );
    component.load();
    expect(component.error).toBe('Erro de conexão.');
    expect(component.loading).toBeFalse();
  });

  it('should use fallback error message when userMessage is absent', () => {
    mockTimeService.getTime.and.returnValue(throwError(() => ({})));
    component.load();
    expect(component.error).toBeTruthy();
    expect(component.loading).toBeFalse();
  });

  it('should show avisoMercado alert when present', () => {
    component.time = { ...mockTime, avisoMercado: 'Mercado fechado.' };
    fixture.detectChanges();
    const banners = fixture.nativeElement.querySelectorAll('app-alert-banner');
    expect(banners.length).toBeGreaterThan(0);
  });

  it('should calculate titularesCount correctly', () => {
    expect(component.titularesCount).toBe(12);
  });

  it('should calculate duvidaCount as 0 when no doubts', () => {
    expect(component.duvidaCount).toBe(0);
  });

  it('should calculate duvidaCount correctly when doubts exist', () => {
    component.time = {
      ...mockTime,
      titulares: [
        ...mockTime.titulares.slice(0, 10),
        makeAtleta({ apelido: 'X', posicao: 'ATA', emDuvida: true }),
        makeAtleta({ apelido: 'Y', posicao: 'TEC', emDuvida: true })
      ]
    };
    expect(component.duvidaCount).toBe(2);
  });

  it('should calculate totalPreco correctly', () => {
    const expectedTotal = mockTime.titulares.reduce((s, a) => s + a.preco, 0);
    expect(component.totalPreco).toBeCloseTo(expectedTotal, 1);
  });

  it('should calculate mediaScore correctly', () => {
    const total = mockTime.titulares.reduce((s, a) => s + a.score, 0);
    const expected = total / mockTime.titulares.length;
    expect(component.mediaScore).toBeCloseTo(expected, 2);
  });

  it('should return 0 for mediaScore when time is null', () => {
    component.time = null;
    expect(component.mediaScore).toBe(0);
  });

  it('should return 0 for totalPreco when time is null', () => {
    component.time = null;
    expect(component.totalPreco).toBe(0);
  });

  it('should call getTime again when load() is called manually', () => {
    component.load();
    expect(mockTimeService.getTime).toHaveBeenCalledTimes(2);
  });

  it('should pass orcamento to getTime when set', () => {
    mockTimeService.getTime.calls.reset();
    component.orcamento = 120;
    component.load();
    expect(mockTimeService.getTime).toHaveBeenCalledWith(120);
  });

  it('should pass null to getTime when orcamento is empty', () => {
    mockTimeService.getTime.calls.reset();
    component.orcamento = null;
    component.load();
    expect(mockTimeService.getTime).toHaveBeenCalledWith(null);
  });

  it('should not call getTime when orcamento is invalid', () => {
    mockTimeService.getTime.calls.reset();
    component.orcamento = 0;
    component.load();
    expect(component.orcamentoInvalido).toBeTrue();
    expect(mockTimeService.getTime).not.toHaveBeenCalled();
  });

  it('should flag negative orcamento as invalid', () => {
    component.orcamento = -5;
    expect(component.orcamentoInvalido).toBeTrue();
  });

  it('should clear orcamento via onLimparOrcamento', () => {
    component.orcamento = 100;
    component.onLimparOrcamento();
    expect(component.orcamento).toBeNull();
  });

  it('should label estrategia SCORE_MAXIMO', () => {
    component.time = { ...mockTime, estrategia: 'SCORE_MAXIMO' };
    expect(component.estrategiaLabel).toContain('Score Máximo');
  });

  it('should label estrategia CUSTO_BENEFICIO', () => {
    component.time = { ...mockTime, estrategia: 'CUSTO_BENEFICIO' };
    expect(component.estrategiaLabel).toContain('Custo-Benefício');
  });

  it('should expose custoTotal from the API response', () => {
    component.time = { ...mockTime, custoTotal: 118.3 };
    expect(component.custoTotal).toBe(118.3);
  });

  it('should compute budgetPercent from custoTotal and orcamentoInformado', () => {
    component.time = { ...mockTime, custoTotal: 60, orcamentoInformado: 120, saldoRestante: 60 };
    expect(component.budgetPercent).toBeCloseTo(50, 1);
  });

  it('should clamp budgetPercent to 100 when over budget', () => {
    component.time = { ...mockTime, custoTotal: 150, orcamentoInformado: 120, saldoRestante: -30 };
    expect(component.budgetPercent).toBeGreaterThan(100);
    expect(component.budgetPercentClamped).toBe(100);
  });

  it('should render the budget bar when orcamentoInformado is present', () => {
    component.time = { ...mockTime, custoTotal: 118.3, orcamentoInformado: 120, saldoRestante: 1.7 };
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.budget-bar')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.custo-total-line')).toBeFalsy();
  });

  it('should render plain custo total line when no orcamento is informed', () => {
    component.time = { ...mockTime, orcamentoInformado: null };
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.budget-bar')).toBeFalsy();
    expect(fixture.nativeElement.querySelector('.custo-total-line')).toBeTruthy();
  });

  it('should show avisoOrcamento banner when present', () => {
    component.time = { ...mockTime, avisoOrcamento: 'Orçamento insuficiente.' };
    fixture.detectChanges();
    const banners = fixture.nativeElement.querySelectorAll('app-alert-banner');
    expect(banners.length).toBeGreaterThan(0);
  });
});
