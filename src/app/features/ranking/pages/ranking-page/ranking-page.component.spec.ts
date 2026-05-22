import { TestBed, ComponentFixture } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { RankingPageComponent } from './ranking-page.component';
import { RankingService } from '../../services/ranking.service';
import { RankingResponse } from '../../../../shared/models/ranking.model';
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

const mockRanking: RankingResponse = {
  atletas: [
    makeAtleta({ apelido: 'Santos', posicao: 'GOL', score: 11.1, criterioScore: 'Goleiro defensivo', desvioPadrao: 1.5, rodadasConsideradas: 5 }),
    makeAtleta({ apelido: 'Gabigol', posicao: 'ATA', score: 9.8, criterioScore: 'Atacante ofensivo', desvioPadrao: 3.2, rodadasConsideradas: 5 }),
    makeAtleta({ apelido: 'Arrascaeta', posicao: 'MEI', score: 10.2, rodadasConsideradas: 1 })
  ],
  avisoMercado: null,
  rodada: 15,
  criteriosScorePorPosicao: {
    GOL: 'Goleiros priorizam indicadores defensivos.',
    ATA: 'Atacantes priorizam gols e assistências.'
  }
};

describe('RankingPageComponent', () => {
  let fixture: ComponentFixture<RankingPageComponent>;
  let component: RankingPageComponent;
  let mockRankingService: jasmine.SpyObj<RankingService>;

  beforeEach(async () => {
    mockRankingService = jasmine.createSpyObj('RankingService', ['getRanking']);
    mockRankingService.getRanking.and.returnValue(of(mockRanking));

    await TestBed.configureTestingModule({
      imports: [RankingPageComponent],
      providers: [{ provide: RankingService, useValue: mockRankingService }]
    }).compileComponents();

    fixture = TestBed.createComponent(RankingPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should call getRanking on init', () => {
    expect(mockRankingService.getRanking).toHaveBeenCalledTimes(1);
  });

  it('should call getRanking with default params', () => {
    expect(mockRankingService.getRanking).toHaveBeenCalledWith(undefined, 25);
  });

  it('should populate data after load', () => {
    expect(component.data).toEqual(mockRanking);
  });

  it('should set loading to false after load', () => {
    expect(component.loading).toBeFalse();
  });

  it('should set error on failure', () => {
    mockRankingService.getRanking.and.returnValue(
      throwError(() => ({ userMessage: 'Posição inválida.' }))
    );
    component.buscar();
    expect(component.error).toBe('Posição inválida.');
    expect(component.loading).toBeFalse();
  });

  it('should pass posicaoSelecionada when buscar is called with filter', () => {
    component.posicaoSelecionada = 'ATA';
    component.limiteSelecionado = 10;
    component.buscar();
    expect(mockRankingService.getRanking).toHaveBeenCalledWith('ATA', 10);
  });

  it('should pass undefined for posicao when posicaoSelecionada is empty', () => {
    component.posicaoSelecionada = '';
    component.buscar();
    expect(mockRankingService.getRanking).toHaveBeenCalledWith(undefined, jasmine.any(Number));
  });

  it('should render table when data is available', () => {
    const table = fixture.nativeElement.querySelector('.ranking-table');
    expect(table).toBeTruthy();
  });

  it('should render correct number of rows', () => {
    const rows = fixture.nativeElement.querySelectorAll('.ranking-row');
    expect(rows.length).toBe(3);
  });

  it('should preserve API ranking order by returned score', () => {
    const players = Array.from<HTMLElement>(
      fixture.nativeElement.querySelectorAll('.player-apelido')
    ).map((el) => el.textContent?.trim());
    expect(players).toEqual(['Santos', 'Gabigol', 'Arrascaeta']);
  });

  it('should render score criteria for goalkeeper, forward and fallback positions', () => {
    const criteria = fixture.nativeElement.querySelectorAll('.score-criterion');
    expect(criteria[0].textContent).toContain('Goleiro defensivo');
    expect(criteria[1].textContent).toContain('Atacante ofensivo');
    expect(criteria[2].textContent).toContain('Critério padrão da API');
  });

  it('should show position-specific score context when filtered', () => {
    component.posicaoSelecionada = 'GOL';
    fixture.detectChanges();
    const context = fixture.nativeElement.querySelector('.score-context');
    expect(context.textContent).toContain('Goleiros priorizam indicadores defensivos.');
  });

  it('should calculate scorePercent correctly', () => {
    const atleta = makeAtleta({ score: 6 });
    expect(component.scorePercent(atleta)).toBe(50);
  });

  it('should clamp scorePercent at 100', () => {
    const atleta = makeAtleta({ score: 20 });
    expect(component.scorePercent(atleta)).toBe(100);
  });

  it('should have correct default posicoes list length', () => {
    expect(component.posicoes.length).toBe(7); // todos + 6 posições
  });

  it('should render a consistency badge in each score cell', () => {
    const badges = fixture.nativeElement.querySelectorAll('.score-cell app-consistencia-badge .consistencia-badge');
    expect(badges.length).toBe(3);
    expect(badges[0].getAttribute('data-level')).toBe('consistente');
    expect(badges[1].getAttribute('data-level')).toBe('moderado');
    expect(badges[2].getAttribute('data-level')).toBe('indisponivel');
  });

  it('should show avisoMercado alert when present', () => {
    mockRankingService.getRanking.and.returnValue(
      of({ ...mockRanking, avisoMercado: 'Mercado fechado.' })
    );
    component.buscar();
    fixture.detectChanges();
    expect(component.data?.avisoMercado).toBe('Mercado fechado.');
  });
});
