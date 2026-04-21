import { TestBed, ComponentFixture } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { FavoritosPageComponent } from './favoritos-page.component';
import { FavoritosService } from '../../services/favoritos.service';
import { FavoritosResponse, JogoFavorito } from '../../../../shared/models/favoritos.model';

const mockFavoritos: FavoritosResponse = {
  favoritos: [
    {
      timeFavorito: 'Flamengo',
      oddFavorito: 2.1,
      timeAdversario: 'Palmeiras',
      oddAdversario: 3.4,
      oddEmpate: 3.2,
      favoritoEmCasa: true
    },
    {
      timeFavorito: 'Athletico PR',
      oddFavorito: 2.5,
      timeAdversario: 'Santos',
      oddAdversario: 3.0,
      oddEmpate: 3.1,
      favoritoEmCasa: false
    }
  ],
  descartados: [
    {
      timeCasa: 'Fortaleza',
      timeVisitante: 'Bahia',
      motivo: 'Nenhum time com odd abaixo de 3.0'
    }
  ],
  oddLimiteUtilizado: 3.0
};

describe('FavoritosPageComponent', () => {
  let fixture: ComponentFixture<FavoritosPageComponent>;
  let component: FavoritosPageComponent;
  let mockFavoritosService: jasmine.SpyObj<FavoritosService>;

  beforeEach(async () => {
    mockFavoritosService = jasmine.createSpyObj('FavoritosService', ['getFavoritos']);
    mockFavoritosService.getFavoritos.and.returnValue(of(mockFavoritos));

    await TestBed.configureTestingModule({
      imports: [FavoritosPageComponent],
      providers: [{ provide: FavoritosService, useValue: mockFavoritosService }]
    }).compileComponents();

    fixture = TestBed.createComponent(FavoritosPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should call getFavoritos on init', () => {
    expect(mockFavoritosService.getFavoritos).toHaveBeenCalledTimes(1);
  });

  it('should call getFavoritos without oddLimite by default', () => {
    expect(mockFavoritosService.getFavoritos).toHaveBeenCalledWith(undefined);
  });

  it('should populate data after successful load', () => {
    expect(component.data).toEqual(mockFavoritos);
  });

  it('should set loading to false after load', () => {
    expect(component.loading).toBeFalse();
  });

  it('should set error on failure', () => {
    mockFavoritosService.getFavoritos.and.returnValue(
      throwError(() => ({ userMessage: 'Erro ao buscar favoritos.' }))
    );
    component.buscar();
    expect(component.error).toBe('Erro ao buscar favoritos.');
    expect(component.loading).toBeFalse();
  });

  it('should pass oddLimite when provided', () => {
    component.oddLimite = 2.5;
    component.buscar();
    expect(mockFavoritosService.getFavoritos).toHaveBeenCalledWith(2.5);
  });

  it('should reset oddLimite and call buscar when resetar is called', () => {
    component.oddLimite = 2.5;
    component.resetar();
    expect(component.oddLimite).toBeNull();
    expect(mockFavoritosService.getFavoritos).toHaveBeenCalledWith(undefined);
  });

  it('should render favoritos cards', () => {
    const cards = fixture.nativeElement.querySelectorAll('.match-card');
    expect(cards.length).toBe(2);
  });

  it('should render descartados list', () => {
    const items = fixture.nativeElement.querySelectorAll('.discarded-card');
    expect(items.length).toBe(1);
  });

  it('should calculate probFavorito correctly', () => {
    const jogo: JogoFavorito = {
      timeFavorito: 'Flamengo',
      oddFavorito: 2.0,
      timeAdversario: 'Palmeiras',
      oddAdversario: 4.0,
      favoritoEmCasa: true
    };
    // 1/2 = 0.5; 1/4 = 0.25; total = 0.75; prob = 0.5/0.75 ≈ 66.67
    const prob = component.probFavorito(jogo);
    expect(prob).toBeCloseTo(66.67, 1);
  });

  it('should calculate probFavorito with empate', () => {
    const jogo: JogoFavorito = {
      timeFavorito: 'Flamengo',
      oddFavorito: 2.0,
      timeAdversario: 4.0 as any,
      oddAdversario: 4.0,
      oddEmpate: 4.0,
      favoritoEmCasa: true
    };
    // 1/2=0.5; 1/4=0.25; 1/4=0.25; total=1.0; prob = 0.5/1.0 = 50
    const prob = component.probFavorito(jogo);
    expect(prob).toBeCloseTo(50, 1);
  });

  it('should return 0 for probEmpate when oddEmpate is undefined', () => {
    const jogo: JogoFavorito = {
      timeFavorito: 'Flamengo',
      oddFavorito: 2.0,
      timeAdversario: 'Palmeiras',
      oddAdversario: 4.0,
      favoritoEmCasa: true
    };
    expect(component.probEmpate(jogo)).toBe(0);
  });

  it('should calculate probEmpate correctly when oddEmpate is present', () => {
    const jogo: JogoFavorito = {
      timeFavorito: 'Flamengo',
      oddFavorito: 2.0,
      timeAdversario: 'Palmeiras',
      oddAdversario: 4.0,
      oddEmpate: 4.0,
      favoritoEmCasa: true
    };
    // 1/2=0.5; 1/4=0.25; 1/4=0.25; total=1.0; probEmp = 0.25/1.0 = 25
    expect(component.probEmpate(jogo)).toBeCloseTo(25, 1);
  });

  it('should display summary pills with correct counts', () => {
    const pills = fixture.nativeElement.querySelectorAll('.summary-pill');
    expect(pills.length).toBe(3);
  });

  it('should show fallback error when userMessage is absent', () => {
    mockFavoritosService.getFavoritos.and.returnValue(throwError(() => ({})));
    component.buscar();
    expect(component.error).toBeTruthy();
  });
});
