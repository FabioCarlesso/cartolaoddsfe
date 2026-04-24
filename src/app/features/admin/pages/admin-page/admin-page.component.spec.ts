import { TestBed, ComponentFixture } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { AdminPageComponent } from './admin-page.component';
import { ConfiguracaoService } from '../../services/configuracao.service';
import { CacheService } from '../../services/cache.service';
import { ConfiguracaoResponse, CacheResponse } from '../../../../shared/models/configuracao.model';

const mockConfig: ConfiguracaoResponse = {
  oddLimite: 3.0,
  pesoMediaPontos: 0.40,
  pesoValorizacao: 0.20,
  pesoDesempenho: 0.20,
  pesoFatorCasa: 0.10,
  pesoTimeFavorito: 0.10,
  formacaoGol: 1,
  formacaoLat: 2,
  formacaoZag: 2,
  formacaoMei: 3,
  formacaoAta: 3,
  formacaoTec: 1,
  updatedAt: '2025-06-01T15:30:00'
};

const mockCacheResponse: CacheResponse = {
  cachesInvalidados: ['odds', 'atletas', 'clubes', 'partidas', 'pontuados', 'statusMercado'],
  mensagem: 'Todos os caches invalidados com sucesso.',
  timestamp: '2025-06-01T15:30:00'
};

describe('AdminPageComponent', () => {
  let fixture: ComponentFixture<AdminPageComponent>;
  let component: AdminPageComponent;
  let mockConfigService: jasmine.SpyObj<ConfiguracaoService>;
  let mockCacheService: jasmine.SpyObj<CacheService>;

  beforeEach(async () => {
    mockConfigService = jasmine.createSpyObj('ConfiguracaoService', ['getConfig', 'patchConfig', 'resetConfig']);
    mockCacheService = jasmine.createSpyObj('CacheService', ['invalidateAll', 'invalidateByName']);

    mockConfigService.getConfig.and.returnValue(of(mockConfig));
    mockConfigService.patchConfig.and.returnValue(of(mockConfig));
    mockConfigService.resetConfig.and.returnValue(of(mockConfig));
    mockCacheService.invalidateAll.and.returnValue(of(mockCacheResponse));
    mockCacheService.invalidateByName.and.returnValue(of({
      cachesInvalidados: ['atletas'],
      mensagem: "Cache 'atletas' invalidado com sucesso.",
      timestamp: '2025-06-01T15:30:00'
    }));

    await TestBed.configureTestingModule({
      imports: [AdminPageComponent],
      providers: [
        { provide: ConfiguracaoService, useValue: mockConfigService },
        { provide: CacheService, useValue: mockCacheService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AdminPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load config on init', () => {
    expect(mockConfigService.getConfig).toHaveBeenCalledTimes(1);
    expect(component.config).toEqual(mockConfig);
  });

  it('should sync form from config on load', () => {
    expect(component.form.oddLimite).toBe(3.0);
    expect(component.form.pesoMediaPontos).toBe(0.40);
    expect(component.form.formacaoGol).toBe(1);
  });

  it('should set loadError on getConfig failure', () => {
    mockConfigService.getConfig.and.returnValue(
      throwError(() => ({ userMessage: 'Servidor inacessível.' }))
    );
    component.loadConfig();
    expect(component.loadError).toBe('Servidor inacessível.');
    expect(component.loadingConfig).toBeFalse();
  });

  it('should call patchConfig with form values on salvar', () => {
    component.form.oddLimite = 2.5;
    component.salvar();
    expect(mockConfigService.patchConfig).toHaveBeenCalledWith(component.form);
  });

  it('should set successMessage after salvar', () => {
    component.salvar();
    expect(component.successMessage).toContain('sucesso');
    expect(component.saving).toBeFalse();
  });

  it('should set saveError on patchConfig failure', () => {
    mockConfigService.patchConfig.and.returnValue(
      throwError(() => ({ userMessage: 'Erro de validação.' }))
    );
    component.salvar();
    expect(component.saveError).toBe('Erro de validação.');
    expect(component.saving).toBeFalse();
  });

  it('should call resetConfig on resetar', () => {
    component.resetar();
    expect(mockConfigService.resetConfig).toHaveBeenCalledTimes(1);
  });

  it('should set successMessage after resetar', () => {
    component.resetar();
    expect(component.successMessage).toContain('padrão');
  });

  it('should calculate somasPesos correctly', () => {
    expect(component.somasPesos).toBeCloseTo(1.0, 5);
  });

  it('should consider pesosValidos true when sum is 1.0', () => {
    expect(component.pesosValidos).toBeTrue();
  });

  it('should consider pesosValidos false when sum differs from 1.0 by more than 0.01', () => {
    component.form.pesoMediaPontos = 0.50;
    expect(component.pesosValidos).toBeFalse();
  });

  it('should invalidate all caches on invalidarTodos', () => {
    component.invalidarTodos();
    expect(mockCacheService.invalidateAll).toHaveBeenCalledTimes(1);
    expect(component.cacheResult).toEqual(mockCacheResponse);
    expect(component.cacheLoading).toBeNull();
  });

  it('should invalidate specific cache on invalidarCache', () => {
    component.invalidarCache('atletas');
    expect(mockCacheService.invalidateByName).toHaveBeenCalledWith('atletas');
    expect(component.cacheResult?.cachesInvalidados).toEqual(['atletas']);
  });

  it('should set cacheError on invalidateAll failure', () => {
    mockCacheService.invalidateAll.and.returnValue(
      throwError(() => ({ userMessage: 'Erro ao invalidar.' }))
    );
    component.invalidarTodos();
    expect(component.cacheError).toBe('Erro ao invalidar.');
    expect(component.cacheLoading).toBeNull();
  });

  it('should set cacheError on invalidateByName failure', () => {
    mockCacheService.invalidateByName.and.returnValue(
      throwError(() => ({ userMessage: 'Cache não encontrado.' }))
    );
    component.invalidarCache('xyz');
    expect(component.cacheError).toBe('Cache não encontrado.');
  });

  it('should expose 6 cache names', () => {
    expect(component.cacheNames.length).toBe(6);
  });

  it('should render config section when config is loaded', () => {
    const section = fixture.nativeElement.querySelector('.config-section');
    expect(section).toBeTruthy();
  });

  it('should render cache grid', () => {
    const grid = fixture.nativeElement.querySelector('.cache-grid');
    expect(grid).toBeTruthy();
  });
});
