import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';
import { LoginResponse, Perfil } from '../models/auth.model';

const TOKEN_KEY = 'cartolaodds.accessToken';
const NOME_KEY = 'cartolaodds.nome';

/** Monta um JWT sem assinatura válida — o cliente só lê os claims, quem valida é a API. */
export function fakeToken(claims: Record<string, unknown>): string {
  const encode = (obj: unknown) =>
    btoa(JSON.stringify(obj)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  return `${encode({ alg: 'HS256', typ: 'JWT' })}.${encode(claims)}.assinatura`;
}

export function tokenValido(perfil: Perfil = 'USER', email = 'fabio@cartolaodds.local'): string {
  return fakeToken({
    sub: email,
    perfil,
    usuarioId: 7,
    exp: Math.floor(Date.now() / 1000) + 3600
  });
}

export function tokenExpirado(perfil: Perfil = 'USER'): string {
  return fakeToken({
    sub: 'fabio@cartolaodds.local',
    perfil,
    usuarioId: 7,
    exp: Math.floor(Date.now() / 1000) - 60
  });
}

const loginResponse: LoginResponse = {
  accessToken: tokenValido('ADMIN'),
  tipo: 'Bearer',
  expiraEmSegundos: 86400,
  nome: 'Fabio Carlesso',
  perfil: 'ADMIN'
};

describe('AuthService', () => {
  let httpMock: HttpTestingController;
  let router: jasmine.SpyObj<Router>;

  function criarService(): AuthService {
    return TestBed.inject(AuthService);
  }

  beforeEach(() => {
    localStorage.clear();
    router = jasmine.createSpyObj('Router', ['navigate']);
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: Router, useValue: router }
      ]
    });
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('should start without session', () => {
    const service = criarService();
    expect(service.autenticado()).toBeFalse();
    expect(service.getUsuarioAtual()).toBeNull();
  });

  it('should store token and expose session after login', (done) => {
    const service = criarService();

    service.login({ email: 'fabio@cartolaodds.local', senha: 'senha-forte-123' }).subscribe(() => {
      expect(localStorage.getItem(TOKEN_KEY)).toBe(loginResponse.accessToken);
      expect(service.autenticado()).toBeTrue();
      expect(service.getUsuarioAtual()?.nome).toBe('Fabio Carlesso');
      expect(service.getPerfilAtual()).toBe('ADMIN');
      expect(service.isAdmin()).toBeTrue();
      done();
    });

    const req = httpMock.expectOne('/api/auth/login');
    expect(req.request.method).toBe('POST');
    req.flush(loginResponse);
  });

  it('should read id, email and perfil from the token claims', (done) => {
    const service = criarService();

    service.login({ email: 'fabio@cartolaodds.local', senha: 'x' }).subscribe(() => {
      const usuario = service.getUsuarioAtual();
      expect(usuario?.usuarioId).toBe(7);
      expect(usuario?.email).toBe('fabio@cartolaodds.local');
      done();
    });

    httpMock.expectOne('/api/auth/login').flush(loginResponse);
  });

  it('should restore the session from localStorage on boot', () => {
    localStorage.setItem(TOKEN_KEY, tokenValido('USER'));
    localStorage.setItem(NOME_KEY, 'Fabio');

    const service = criarService();

    expect(service.autenticado()).toBeTrue();
    expect(service.getUsuarioAtual()?.nome).toBe('Fabio');
    expect(service.getPerfilAtual()).toBe('USER');
  });

  it('should fall back to the e-mail when the stored name is missing', () => {
    localStorage.setItem(TOKEN_KEY, tokenValido('USER', 'sem-nome@cartolaodds.local'));

    const service = criarService();

    expect(service.getUsuarioAtual()?.nome).toBe('sem-nome@cartolaodds.local');
  });

  it('should reject an expired token and clear the storage', () => {
    localStorage.setItem(TOKEN_KEY, tokenExpirado());
    localStorage.setItem(NOME_KEY, 'Fabio');

    const service = criarService();

    expect(service.isAuthenticated()).toBeFalse();
    expect(service.autenticado()).toBeFalse();
    expect(localStorage.getItem(TOKEN_KEY)).toBeNull();
    expect(localStorage.getItem(NOME_KEY)).toBeNull();
  });

  it('should reject a token without the perfil claim', () => {
    localStorage.setItem(TOKEN_KEY, fakeToken({ sub: 'x@y.z', exp: Math.floor(Date.now() / 1000) + 60 }));

    const service = criarService();

    expect(service.isAuthenticated()).toBeFalse();
    expect(localStorage.getItem(TOKEN_KEY)).toBeNull();
  });

  it('should reject a token with an unknown perfil claim', () => {
    localStorage.setItem(
      TOKEN_KEY,
      fakeToken({ sub: 'x@y.z', perfil: 'ROOT', exp: Math.floor(Date.now() / 1000) + 60 })
    );

    expect(criarService().isAuthenticated()).toBeFalse();
  });

  it('should reject a malformed token', () => {
    localStorage.setItem(TOKEN_KEY, 'nao-e-um-jwt');

    expect(criarService().isAuthenticated()).toBeFalse();
  });

  it('should detect expiration that happens while the tab is open', () => {
    const service = criarService();
    localStorage.setItem(TOKEN_KEY, tokenValido());
    expect(service.isAuthenticated()).toBeTrue();

    localStorage.setItem(TOKEN_KEY, tokenExpirado());
    expect(service.isAuthenticated()).toBeFalse();
  });

  it('should clear the session and go to /login on logout', () => {
    localStorage.setItem(TOKEN_KEY, tokenValido());
    const service = criarService();

    service.logout();

    expect(service.autenticado()).toBeFalse();
    expect(localStorage.getItem(TOKEN_KEY)).toBeNull();
    expect(router.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('should flag the expired session when the logout is forced', () => {
    localStorage.setItem(TOKEN_KEY, tokenValido());
    const service = criarService();

    service.encerrarSessaoExpirada();

    expect(service.autenticado()).toBeFalse();
    expect(router.navigate).toHaveBeenCalledWith(['/login'], { queryParams: { expirada: '1' } });
  });

  it('should keep working when localStorage is unavailable', (done) => {
    spyOn(localStorage, 'getItem').and.throwError('storage bloqueado');
    spyOn(localStorage, 'setItem').and.throwError('storage bloqueado');
    spyOn(localStorage, 'removeItem').and.throwError('storage bloqueado');

    const service = criarService();
    expect(service.autenticado()).toBeFalse();

    service.login({ email: 'fabio@cartolaodds.local', senha: 'x' }).subscribe(() => {
      // Sem storage a sessão vive em memória: o usuário entra, só não sobrevive ao F5.
      expect(service.autenticado()).toBeTrue();
      expect(service.getToken()).toBe(loginResponse.accessToken);
      service.limparSessao();
      expect(service.getToken()).toBeNull();
      done();
    });

    httpMock.expectOne('/api/auth/login').flush(loginResponse);
  });

  it('should call PATCH /api/usuarios/me/senha on alterarSenha', (done) => {
    const service = criarService();

    service.alterarSenha({ senhaAtual: 'velha-123', novaSenha: 'nova-senha-456' }).subscribe(() => done());

    const req = httpMock.expectOne('/api/usuarios/me/senha');
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({ senhaAtual: 'velha-123', novaSenha: 'nova-senha-456' });
    req.flush(null);
  });
});
