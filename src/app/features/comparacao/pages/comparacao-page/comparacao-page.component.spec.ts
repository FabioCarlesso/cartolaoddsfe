import { TestBed, ComponentFixture } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { Router } from '@angular/router';
import { ComparacaoPageComponent } from './comparacao-page.component';
import { ComparacaoService } from '../../services/comparacao.service';
import { ConfiguracaoService } from '../../../admin/services/configuracao.service';
import { CompararResponse } from '../../../../shared/models/comparacao.model';

const mockResposta: CompararResponse = {
  melhorFormacao: '4-3-3',
  resultados: [
    {
      formacao: '4-3-3',
      scoreTotal: 94.3,
      custoTotal: 138.5,
      capitao: { apelido: 'Hulk', posicao: 'ATA', clube: 'Atlético-MG', mediaPontos: 8, valorizacao: 0, preco: 15, score: 9.2, emDuvida: false },
      time: {
        titulares: [], reservas: [], capitao: null, reservaLuxo: null,
        alertasDuvida: [], avisoMercado: null, custoTotal: 138.5,
        orcamentoInformado: null, saldoRestante: null, estrategia: 'SCORE_MAXIMO',
        formacaoCompleta: true, avisoOrcamento: null,
      },
      indisponivel: false,
      aviso: null,
    },
    {
      formacao: '3-4-3',
      scoreTotal: 91.7,
      custoTotal: 132.1,
      capitao: null,
      time: {
        titulares: [], reservas: [], capitao: null, reservaLuxo: null,
        alertasDuvida: [], avisoMercado: null, custoTotal: 132.1,
        orcamentoInformado: null, saldoRestante: null, estrategia: 'SCORE_MAXIMO',
        formacaoCompleta: true, avisoOrcamento: null,
      },
      indisponivel: false,
      aviso: null,
    },
  ],
};

describe('ComparacaoPageComponent', () => {
  let fixture: ComponentFixture<ComparacaoPageComponent>;
  let component: ComparacaoPageComponent;
  let mockComparacao: jasmine.SpyObj<ComparacaoService>;
  let mockConfig: jasmine.SpyObj<ConfiguracaoService>;
  let mockRouter: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    sessionStorage.clear();
    mockComparacao = jasmine.createSpyObj('ComparacaoService', ['comparar']);
    mockComparacao.comparar.and.returnValue(of(mockResposta));
    mockConfig = jasmine.createSpyObj('ConfiguracaoService', ['patchConfig']);
    mockConfig.patchConfig.and.returnValue(of({} as any));
    mockRouter = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [ComparacaoPageComponent],
      providers: [
        { provide: ComparacaoService, useValue: mockComparacao },
        { provide: ConfiguracaoService, useValue: mockConfig },
        { provide: Router, useValue: mockRouter },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ComparacaoPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should start with no formations selected', () => {
    expect(component.selecionadas.length).toBe(0);
    expect(component.podeComparar).toBeFalse();
  });

  it('should toggle a formation on and off', () => {
    component.toggleFormacao('4-3-3');
    expect(component.isSelecionada('4-3-3')).toBeTrue();
    component.toggleFormacao('4-3-3');
    expect(component.isSelecionada('4-3-3')).toBeFalse();
  });

  it('should disable the compare button with fewer than two formations', () => {
    component.toggleFormacao('4-3-3');
    expect(component.podeComparar).toBeFalse();
    component.toggleFormacao('3-4-3');
    expect(component.podeComparar).toBeTrue();
  });

  it('should not select more than five formations and disable remaining chips', () => {
    ['4-3-3', '3-4-3', '4-4-2', '5-3-2', '4-5-1'].forEach((f) => component.toggleFormacao(f));
    expect(component.selecionadas.length).toBe(5);
    expect(component.isChipDesabilitada('3-5-2')).toBeTrue();
    component.toggleFormacao('3-5-2');
    expect(component.selecionadas.length).toBe(5);
    expect(component.isSelecionada('3-5-2')).toBeFalse();
  });

  it('should not compare with an invalid orcamento', () => {
    component.toggleFormacao('4-3-3');
    component.toggleFormacao('3-4-3');
    component.orcamento = -5;
    expect(component.podeComparar).toBeFalse();
  });

  it('should call the service and store the result on compare', () => {
    component.toggleFormacao('4-3-3');
    component.toggleFormacao('3-4-3');
    component.comparar();
    expect(mockComparacao.comparar).toHaveBeenCalledWith(['4-3-3', '3-4-3'], null);
    expect(component.resultado).toEqual(mockResposta);
    expect(component.loading).toBeFalse();
  });

  it('should surface the error message on failure', () => {
    mockComparacao.comparar.and.returnValue(throwError(() => ({ userMessage: 'Falhou' })));
    component.toggleFormacao('4-3-3');
    component.toggleFormacao('3-4-3');
    component.comparar();
    expect(component.error).toBe('Falhou');
    expect(component.resultado).toBeNull();
  });

  it('should expand only one card at a time', () => {
    component.toggleExpandir('4-3-3');
    expect(component.isExpandida('4-3-3')).toBeTrue();
    component.toggleExpandir('3-4-3');
    expect(component.isExpandida('4-3-3')).toBeFalse();
    expect(component.isExpandida('3-4-3')).toBeTrue();
    component.toggleExpandir('3-4-3');
    expect(component.isExpandida('3-4-3')).toBeFalse();
  });

  it('should return medals for the top three and ordinals afterwards', () => {
    expect(component.medalha(0)).toBe('\u{1F947}');
    expect(component.medalha(1)).toBe('\u{1F948}');
    expect(component.medalha(2)).toBe('\u{1F949}');
    expect(component.medalha(3)).toBe('4º');
  });

  it('should open and cancel the confirmation modal', () => {
    component.solicitarUsar('4-3-3');
    expect(component.confirmarFormacao).toBe('4-3-3');
    component.cancelarUsar();
    expect(component.confirmarFormacao).toBeNull();
  });

  it('should patch config and navigate to /time on confirm', () => {
    component.solicitarUsar('4-3-3');
    component.confirmarUsar();
    expect(mockConfig.patchConfig).toHaveBeenCalledWith(
      jasmine.objectContaining({ formacaoMei: 3, formacaoAta: 3, formacaoZag: 2 })
    );
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/time']);
    expect(component.confirmarFormacao).toBeNull();
    expect(component.sucesso).toContain('4-3-3');
  });

  it('should keep the modal open and show an error when the patch fails', () => {
    mockConfig.patchConfig.and.returnValue(throwError(() => ({ userMessage: 'Erro PATCH' })));
    component.solicitarUsar('4-3-3');
    component.confirmarUsar();
    expect(mockRouter.navigate).not.toHaveBeenCalled();
    expect(component.confirmarFormacao).toBe('4-3-3');
    expect(component.aplicarErro).toBe('Erro PATCH');
  });

  it('should persist selected formations across instances in the session', async () => {
    component.toggleFormacao('4-3-3');
    component.toggleFormacao('5-3-2');

    const fixture2 = TestBed.createComponent(ComparacaoPageComponent);
    expect(fixture2.componentInstance.selecionadas).toEqual(['4-3-3', '5-3-2']);
  });
});
