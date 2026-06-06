import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { HistoricoPageComponent } from './historico-page.component';
import { HistoricoService } from '../../services/historico.service';
import { HistoricoResponse, RodadaResumo, EscalacaoRodadaResponse } from '../../../../shared/models/historico.model';

function rodada(over: Partial<RodadaResumo>): RodadaResumo {
  return {
    rodadaId: 1,
    criadoEm: '2025-05-01T10:00:00',
    totalAtletas: 12,
    scoreSugeridoTotal: 100,
    pontuacaoRealTotal: 90,
    pontuacaoRealDisponivel: true,
    ...over
  };
}

const mockHistorico: HistoricoResponse = {
  totalRodadas: 2,
  rodadas: [
    rodada({ rodadaId: 13, pontuacaoRealTotal: 85, pontuacaoRealDisponivel: true }),
    rodada({ rodadaId: 15, pontuacaoRealTotal: null, pontuacaoRealDisponivel: false })
  ]
};

async function setup(service: jasmine.SpyObj<HistoricoService>): Promise<ComponentFixture<HistoricoPageComponent>> {
  await TestBed.configureTestingModule({
    imports: [HistoricoPageComponent],
    providers: [{ provide: HistoricoService, useValue: service }, provideRouter([])]
  }).compileComponents();
  const fixture = TestBed.createComponent(HistoricoPageComponent);
  fixture.detectChanges();
  return fixture;
}

describe('HistoricoPageComponent', () => {
  let mockService: jasmine.SpyObj<HistoricoService>;

  beforeEach(() => {
    mockService = jasmine.createSpyObj('HistoricoService', ['getHistorico', 'atualizarPontuacao']);
    mockService.getHistorico.and.returnValue(of(mockHistorico));
  });

  it('should create and load on init', async () => {
    const fixture = await setup(mockService);
    expect(mockService.getHistorico).toHaveBeenCalledTimes(1);
    expect(fixture.componentInstance.rodadas.length).toBe(2);
  });

  it('should sort rodadas from most recent to oldest', async () => {
    const fixture = await setup(mockService);
    expect(fixture.componentInstance.rodadas.map((r) => r.rodadaId)).toEqual([15, 13]);
  });

  it('should render empty state with CTA when there are no rodadas', async () => {
    mockService.getHistorico.and.returnValue(of({ totalRodadas: 0, rodadas: [] }));
    const fixture = await setup(mockService);
    const empty = fixture.nativeElement.querySelector('.empty-state');
    expect(empty).toBeTruthy();
    expect(empty.querySelector('a[href="/time"]')).toBeTruthy();
  });

  it('should set error on failure', async () => {
    mockService.getHistorico.and.returnValue(throwError(() => ({ userMessage: 'Falhou' })));
    const fixture = await setup(mockService);
    expect(fixture.componentInstance.error).toBe('Falhou');
  });

  it('should classify delta level green/yellow/red by ratio', async () => {
    const fixture = await setup(mockService);
    const c = fixture.componentInstance;
    expect(c.delta(rodada({ scoreSugeridoTotal: 100, pontuacaoRealTotal: 95 })).level).toBe('verde');
    expect(c.delta(rodada({ scoreSugeridoTotal: 100, pontuacaoRealTotal: 80 })).level).toBe('amarelo');
    expect(c.delta(rodada({ scoreSugeridoTotal: 100, pontuacaoRealTotal: 50 })).level).toBe('vermelho');
  });

  it('should cap progress bar width at 100%', async () => {
    const fixture = await setup(mockService);
    const width = fixture.componentInstance.barWidth(rodada({ scoreSugeridoTotal: 100, pontuacaoRealTotal: 150 }));
    expect(width).toBe(100);
  });

  it('should render a card per rodada', async () => {
    const fixture = await setup(mockService);
    const cards = fixture.nativeElement.querySelectorAll('.rodada-card');
    expect(cards.length).toBe(2);
  });

  it('should show pending state with atualizar button for rounds without real score', async () => {
    const fixture = await setup(mockService);
    const pendente = fixture.nativeElement.querySelector('.pendente');
    expect(pendente).toBeTruthy();
  });

  it('should not render evolution chart with fewer than 3 real rounds', async () => {
    const fixture = await setup(mockService);
    expect(fixture.componentInstance.evolucao.length).toBe(0);
    expect(fixture.nativeElement.querySelector('.evolucao-chart')).toBeFalsy();
  });

  it('should render evolution chart with 3+ real rounds', async () => {
    mockService.getHistorico.and.returnValue(of({
      totalRodadas: 3,
      rodadas: [
        rodada({ rodadaId: 13, pontuacaoRealTotal: 85 }),
        rodada({ rodadaId: 14, pontuacaoRealTotal: 95 }),
        rodada({ rodadaId: 15, pontuacaoRealTotal: 87 })
      ]
    }));
    const fixture = await setup(mockService);
    expect(fixture.componentInstance.evolucao.length).toBe(3);
    // ascending by rodada for the chart
    expect(fixture.componentInstance.evolucao.map((p) => p.rodadaId)).toEqual([13, 14, 15]);
    expect(fixture.nativeElement.querySelector('.evolucao-chart')).toBeTruthy();
  });

  it('should update a single card inline after atualizar succeeds', async () => {
    const fixture = await setup(mockService);
    const detalhe: EscalacaoRodadaResponse = {
      rodadaId: 15,
      atletas: [
        { apelido: 'A', posicao: 'ATA', clube: 'X', scoreSugerido: 10, pontuacaoReal: 8, capitao: true, reservaLuxo: false, emDuvida: false },
        { apelido: 'B', posicao: 'MEI', clube: 'Y', scoreSugerido: 7, pontuacaoReal: 5, capitao: false, reservaLuxo: false, emDuvida: false }
      ]
    };
    mockService.atualizarPontuacao.and.returnValue(of(detalhe));
    const alvo = fixture.componentInstance.rodadas.find((r) => r.rodadaId === 15)!;
    fixture.componentInstance.atualizar(alvo);
    const atualizada = fixture.componentInstance.rodadas.find((r) => r.rodadaId === 15)!;
    expect(atualizada.pontuacaoRealDisponivel).toBeTrue();
    // capitão dobrado: 8*2 + 5 = 21
    expect(atualizada.pontuacaoRealTotal).toBe(21);
    expect(fixture.componentInstance.atualizando[15]).toBeFalse();
  });

  it('should set inline error when atualizar fails', async () => {
    const fixture = await setup(mockService);
    mockService.atualizarPontuacao.and.returnValue(throwError(() => ({ userMessage: 'Erro API' })));
    const alvo = fixture.componentInstance.rodadas.find((r) => r.rodadaId === 15)!;
    fixture.componentInstance.atualizar(alvo);
    expect(fixture.componentInstance.erroAtualizar[15]).toBe('Erro API');
    expect(fixture.componentInstance.atualizando[15]).toBeFalse();
  });
});
