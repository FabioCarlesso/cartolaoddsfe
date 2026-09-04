import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree, provideRouter } from '@angular/router';
import { authGuard } from './auth.guard';
import { tokenExpirado, tokenValido } from '../services/auth.service.spec';

const TOKEN_KEY = 'cartolaodds.accessToken';

function rodar(url = '/time'): boolean | UrlTree {
  return TestBed.runInInjectionContext(
    () => authGuard({} as ActivatedRouteSnapshot, { url } as RouterStateSnapshot)
  ) as boolean | UrlTree;
}

describe('authGuard', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()]
    });
  });

  afterEach(() => localStorage.clear());

  it('should allow activation with a valid session', () => {
    localStorage.setItem(TOKEN_KEY, tokenValido());
    expect(rodar()).toBeTrue();
  });

  it('should redirect to /login keeping the intended URL', () => {
    const result = rodar('/historico/38');

    expect(result instanceof UrlTree).toBeTrue();
    expect((result as UrlTree).toString()).toBe('/login?redirect=%2Fhistorico%2F38');
  });

  it('should redirect to /login without redirect param for the root URL', () => {
    expect((rodar('/') as UrlTree).toString()).toBe('/login');
  });

  it('should redirect to /login when the token is expired', () => {
    localStorage.setItem(TOKEN_KEY, tokenExpirado());

    const result = rodar();

    expect(result instanceof UrlTree).toBeTrue();
    expect(localStorage.getItem(TOKEN_KEY)).toBeNull();
  });

  // Quem volta com a sessão vencida é desconectado aqui, antes de qualquer chamada tomar
  // 401 — sem o parâmetro, a tela de login não teria como explicar o que aconteceu.
  it('should flag the expired session when a token was discarded', () => {
    localStorage.setItem(TOKEN_KEY, tokenExpirado());

    const result = rodar('/favoritos') as UrlTree;

    expect(result.toString()).toBe('/login?redirect=%2Ffavoritos&expirada=1');
  });

  it('should not flag an expired session for a visitor who never had one', () => {
    expect((rodar('/favoritos') as UrlTree).toString()).toBe('/login?redirect=%2Ffavoritos');
  });

  it('should flag the expired session only once', () => {
    localStorage.setItem(TOKEN_KEY, tokenExpirado());
    rodar();

    expect((rodar('/favoritos') as UrlTree).toString()).toBe('/login?redirect=%2Ffavoritos');
  });
});
