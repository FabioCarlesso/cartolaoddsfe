import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { FavoritosService } from './favoritos.service';
import { FavoritosResponse } from '../../../shared/models/favoritos.model';

const mockFavoritosResponse: FavoritosResponse = {
  favoritos: [
    {
      timeFavorito: 'Flamengo',
      oddFavorito: 2.1,
      timeAdversario: 'Palmeiras',
      oddAdversario: 3.4,
      oddEmpate: 3.2,
      favoritoEmCasa: true
    }
  ],
  descartados: [
    {
      timeCasa: 'Fortaleza',
      timeVisitante: 'Bahia',
      motivo: 'Nenhum time tem odd abaixo do limite de 3.0'
    }
  ],
  oddLimiteUtilizado: 3.0
};

describe('FavoritosService', () => {
  let service: FavoritosService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [FavoritosService, provideHttpClient(), provideHttpClientTesting()]
    });
    service = TestBed.inject(FavoritosService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should call GET /api/favoritos without params when oddLimite is not provided', () => {
    service.getFavoritos().subscribe();
    const req = httpMock.expectOne((r) => r.url === '/api/favoritos');
    expect(req.request.method).toBe('GET');
    expect(req.request.params.has('oddLimite')).toBeFalse();
    req.flush(mockFavoritosResponse);
  });

  it('should include oddLimite param when provided', () => {
    service.getFavoritos(2.5).subscribe();
    const req = httpMock.expectOne((r) => r.url === '/api/favoritos');
    expect(req.request.params.get('oddLimite')).toBe('2.5');
    req.flush(mockFavoritosResponse);
  });

  it('should return FavoritosResponse data', (done) => {
    service.getFavoritos().subscribe((data) => {
      expect(data.favoritos.length).toBe(1);
      expect(data.favoritos[0].timeFavorito).toBe('Flamengo');
      expect(data.descartados.length).toBe(1);
      expect(data.oddLimiteUtilizado).toBe(3.0);
      done();
    });
    httpMock.expectOne((r) => r.url === '/api/favoritos').flush(mockFavoritosResponse);
  });

  it('should propagate HTTP errors', (done) => {
    service.getFavoritos(0.5).subscribe({
      error: (err) => {
        expect(err.status).toBe(400);
        done();
      }
    });
    httpMock.expectOne((r) => r.url === '/api/favoritos').flush(
      { mensagem: 'oddLimite deve ser maior que 1.0' },
      { status: 400, statusText: 'Bad Request' }
    );
  });
});
