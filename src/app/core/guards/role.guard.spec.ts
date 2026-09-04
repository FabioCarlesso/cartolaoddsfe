import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree, provideRouter } from '@angular/router';
import { roleGuard } from './role.guard';
import { Perfil } from '../models/auth.model';
import { tokenExpirado, tokenValido } from '../services/auth.service.spec';

const TOKEN_KEY = 'cartolaodds.accessToken';

function rodar(perfis: Perfil[], url = '/usuarios'): boolean | UrlTree {
  return TestBed.runInInjectionContext(
    () => roleGuard(perfis)({} as ActivatedRouteSnapshot, { url } as RouterStateSnapshot)
  ) as boolean | UrlTree;
}

describe('roleGuard', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()]
    });
  });

  afterEach(() => localStorage.clear());

  it('should allow ADMIN on an ADMIN-only route', () => {
    localStorage.setItem(TOKEN_KEY, tokenValido('ADMIN'));
    expect(rodar(['ADMIN'])).toBeTrue();
  });

  it('should send USER to /403 on an ADMIN-only route', () => {
    localStorage.setItem(TOKEN_KEY, tokenValido('USER'));

    const result = rodar(['ADMIN']);

    expect(result instanceof UrlTree).toBeTrue();
    expect((result as UrlTree).toString()).toBe('/403');
  });

  it('should allow USER when the route accepts both profiles', () => {
    localStorage.setItem(TOKEN_KEY, tokenValido('USER'));
    expect(rodar(['ADMIN', 'USER'])).toBeTrue();
  });

  it('should send an anonymous visitor to /login keeping the intended URL', () => {
    const result = rodar(['ADMIN']);

    expect(result instanceof UrlTree).toBeTrue();
    expect((result as UrlTree).toString()).toBe('/login?redirect=%2Fusuarios');
  });

  it('should send an expired session to /login instead of /403, flagging it', () => {
    localStorage.setItem(TOKEN_KEY, tokenExpirado('ADMIN'));

    const result = rodar(['ADMIN']);

    expect((result as UrlTree).toString()).toBe('/login?redirect=%2Fusuarios&expirada=1');
    expect(localStorage.getItem(TOKEN_KEY)).toBeNull();
  });
});
