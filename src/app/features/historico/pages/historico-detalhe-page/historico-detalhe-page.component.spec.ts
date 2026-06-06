import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideRouter, ActivatedRoute } from '@angular/router';
import { of, throwError } from 'rxjs';
import { HistoricoDetalhePageComponent } from './historico-detalhe-page.component';
import { HistoricoService } from '../../services/historico.service';
import { AtletaEscalado, EscalacaoRodadaResponse } from '../../../../shared/models/historico.model';

function atleta(over: Partial<AtletaEscalado>): AtletaEscalado {
  return {
    apelido: 'Atleta',
    posicao: 'MEI',
    clube: 'Clube',
    scoreSugerido: 8,
    pontuacaoReal: 7,
    capitao: false,
    reservaLuxo: false,
    emDuvida: false,
    ...over
  };
}

const mockRodada: EscalacaoRodadaResponse = {
  rodadaId: 15,
  atletas: [
    atleta({ apelido: 'Hulk', posicao: 'ATA', scoreSugerido: 9.2, pontuacaoReal: 11.0, capitao: true }),
    atleta({ apelido: 'Arrascaeta', posicao: 'MEI', scoreSugerido: 8.5, pontuacaoReal: 7.0 }),
    atleta({ apelido: 'Pedro', posicao: 'ATA', scoreSugerido: 7.0, pontuacaoReal: null, emDuvida: true }),
    atleta({ apelido: 'Reserva', posicao: 'MEI', scoreSugerido: 6.0, pontuacaoReal: null, reservaLuxo: true })
  ]
};

async function setup(
  service: jasmine.SpyObj<HistoricoService>,
  rodadaId = '15'
): Promise<ComponentFixture<HistoricoDetalhePageComponent>> {
  await TestBed.configureTestingModule({
    imports: [HistoricoDetalhePageComponent],
    providers: [
      { provide: HistoricoService, useValue: service },
      provideRouter([]),
      { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => rodadaId } } } }
    ]
  }).compileComponents();
  const fixture = TestBed.createComponent(HistoricoDetalhePageComponent);
  fixture.detectChanges();
  return fixture;
}

describe('HistoricoDetalhePageComponent', () => {
  let mockService: jasmine.SpyObj<HistoricoService>;

  beforeEach(() => {
    mockService = jasmine.createSpyObj('HistoricoService', ['getRodada', 'atualizarPontuacao']);
    mockService.getRodada.and.returnValue(of(mockRodada));
  });

  it('should load the rodada from the route param on init', async () => {
    const fixture = await setup(mockService);
    expect(mockService.getRodada).toHaveBeenCalledWith(15);
    expect(fixture.componentInstance.data?.rodadaId).toBe(15);
  });

  it('should split titulares and reservas by reservaLuxo', async () => {
    const fixture = await setup(mockService);
    const c = fixture.componentInstance;
    expect(c.titulares.map((a) => a.apelido)).toEqual(['Hulk', 'Arrascaeta', 'Pedro']);
    expect(c.reservas.map((a) => a.apelido)).toEqual(['Reserva']);
  });

  it('should compute scoreSugeridoTotal from titulares', async () => {
    const fixture = await setup(mockService);
    expect(fixture.componentInstance.scoreSugeridoTotal).toBeCloseTo(9.2 + 8.5 + 7.0, 5);
  });

  it('should double captain in pontuacaoRealTotal', async () => {
    const fixture = await setup(mockService);
    // Hulk (capitão) 11*2 + Arrascaeta 7 + Pedro null(0) = 29
    expect(fixture.componentInstance.pontuacaoRealTotal).toBeCloseTo(29, 5);
  });

  it('should mark disponivel when at least one titular has real score', async () => {
    const fixture = await setup(mockService);
    expect(fixture.componentInstance.disponivel).toBeTrue();
  });

  it('should mark not disponivel when no titular has real score', async () => {
    mockService.getRodada.and.returnValue(of({
      rodadaId: 14,
      atletas: [atleta({ apelido: 'X', pontuacaoReal: null })]
    }));
    const fixture = await setup(mockService);
    expect(fixture.componentInstance.disponivel).toBeFalse();
    expect(fixture.nativeElement.querySelector('.grafico-barras')).toBeFalsy();
  });

  it('should render markers for capitão, reserva de luxo and dúvida', async () => {
    const fixture = await setup(mockService);
    const c = fixture.componentInstance;
    expect(c.marcadores(atleta({ capitao: true }))).toContain('⭐');
    expect(c.marcadores(atleta({ reservaLuxo: true }))).toContain('💎');
    expect(c.marcadores(atleta({ emDuvida: true }))).toContain('⚠️');
  });

  it('should render reservas section separately', async () => {
    const fixture = await setup(mockService);
    const sections = fixture.nativeElement.querySelectorAll('.atletas-section');
    // titulares + reservas + gráfico
    expect(sections.length).toBe(3);
  });

  it('should render double-bar chart when real score is available', async () => {
    const fixture = await setup(mockService);
    expect(fixture.nativeElement.querySelector('.grafico-barras')).toBeTruthy();
  });

  it('should compute per-athlete delta as indisponivel when pontuacaoReal is null', async () => {
    const fixture = await setup(mockService);
    const pedro = fixture.componentInstance.titulares.find((a) => a.apelido === 'Pedro')!;
    expect(fixture.componentInstance.delta(pedro).disponivel).toBeFalse();
  });

  it('should set error on load failure', async () => {
    mockService.getRodada.and.returnValue(throwError(() => ({ userMessage: 'Rodada não encontrada' })));
    const fixture = await setup(mockService);
    expect(fixture.componentInstance.error).toBe('Rodada não encontrada');
  });

  it('should refresh data after atualizar succeeds', async () => {
    mockService.getRodada.and.returnValue(of({ rodadaId: 14, atletas: [atleta({ pontuacaoReal: null })] }));
    const fixture = await setup(mockService, '14');
    const atualizada: EscalacaoRodadaResponse = {
      rodadaId: 14,
      atletas: [atleta({ apelido: 'X', pontuacaoReal: 9 })]
    };
    mockService.atualizarPontuacao.and.returnValue(of(atualizada));
    fixture.componentInstance.atualizar();
    expect(mockService.atualizarPontuacao).toHaveBeenCalledWith(14);
    expect(fixture.componentInstance.disponivel).toBeTrue();
    expect(fixture.componentInstance.atualizando).toBeFalse();
  });

  it('should set inline error when atualizar fails', async () => {
    mockService.getRodada.and.returnValue(of({ rodadaId: 14, atletas: [atleta({ pontuacaoReal: null })] }));
    const fixture = await setup(mockService, '14');
    mockService.atualizarPontuacao.and.returnValue(throwError(() => ({ userMessage: 'Erro API' })));
    fixture.componentInstance.atualizar();
    expect(fixture.componentInstance.erroAtualizar).toBe('Erro API');
    expect(fixture.componentInstance.atualizando).toBeFalse();
  });
});
