import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree, provideRouter } from '@angular/router';
import { visitanteGuard } from './visitante.guard';
import { tokenExpirado, tokenValido } from '../services/auth.service.spec';

const TOKEN_KEY = 'cartolaodds.accessToken';

function rodar(): boolean | UrlTree {
  return TestBed.runInInjectionContext(
    () => visitanteGuard({} as ActivatedRouteSnapshot, { url: '/' } as RouterStateSnapshot)
  ) as boolean | UrlTree;
}

describe('visitanteGuard', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()]
    });
  });

  afterEach(() => localStorage.clear());

  it('should let a visitor without a session reach the landing', () => {
    expect(rodar()).toBeTrue();
  });

  // O bookmark de quem usa o app todo dia é a raiz: com sessão válida ele vai direto ao time,
  // sem passar pela página de apresentação.
  it('should send an authenticated user to /time', () => {
    localStorage.setItem(TOKEN_KEY, tokenValido());

    const resultado = rodar();

    expect(resultado instanceof UrlTree).toBeTrue();
    expect((resultado as UrlTree).toString()).toBe('/time');
  });

  it('should treat an expired token as a visitor', () => {
    localStorage.setItem(TOKEN_KEY, tokenExpirado());

    expect(rodar()).toBeTrue();
  });
});
