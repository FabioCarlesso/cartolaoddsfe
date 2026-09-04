import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { UsuarioService } from './usuario.service';
import { Pagina, Usuario } from '../../../core/models/usuario.model';

const mockUsuario: Usuario = {
  id: 1,
  nome: 'Fabio Carlesso',
  email: 'fabio@cartolaodds.local',
  perfil: 'ADMIN',
  ativo: true,
  criadoEm: '2026-01-15T10:00:00'
};

const mockPagina: Pagina<Usuario> = {
  conteudo: [mockUsuario],
  pagina: 0,
  tamanho: 100,
  totalElementos: 1,
  totalPaginas: 1,
  ultima: true
};

describe('UsuarioService', () => {
  let service: UsuarioService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [UsuarioService, provideHttpClient(), provideHttpClientTesting()]
    });
    service = TestBed.inject(UsuarioService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should call GET /api/usuarios sorted by nome', (done) => {
    service.listar().subscribe((pagina) => {
      expect(pagina).toEqual(mockPagina);
      done();
    });

    const req = httpMock.expectOne((r) => r.url === '/api/usuarios');
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('sort')).toBe('nome');
    expect(req.request.params.get('size')).toBe('100');
    req.flush(mockPagina);
  });

  it('should call GET /api/usuarios/{id}', (done) => {
    service.buscarPorId(1).subscribe((usuario) => {
      expect(usuario).toEqual(mockUsuario);
      done();
    });

    const req = httpMock.expectOne('/api/usuarios/1');
    expect(req.request.method).toBe('GET');
    req.flush(mockUsuario);
  });

  it('should call POST /api/usuarios with the body', (done) => {
    const request = {
      nome: 'Novo',
      email: 'novo@cartolaodds.local',
      senha: 'senha-forte-123',
      perfil: 'USER' as const
    };

    service.criar(request).subscribe(() => done());

    const req = httpMock.expectOne('/api/usuarios');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(request);
    req.flush({ ...mockUsuario, ...request, id: 2 });
  });

  it('should propagate the 409 of a duplicated e-mail', (done) => {
    service
      .criar({ nome: 'Novo', email: 'fabio@cartolaodds.local', senha: 'senha-forte-123', perfil: 'USER' })
      .subscribe({
        error: (err) => {
          expect(err.status).toBe(409);
          done();
        }
      });

    httpMock.expectOne('/api/usuarios').flush(
      { mensagem: 'Ja existe um usuario com o e-mail informado.' },
      { status: 409, statusText: 'Conflict' }
    );
  });

  it('should call PATCH /api/usuarios/{id} with only the changed fields', (done) => {
    service.atualizar(1, { perfil: 'USER' }).subscribe(() => done());

    const req = httpMock.expectOne('/api/usuarios/1');
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({ perfil: 'USER' });
    req.flush({ ...mockUsuario, perfil: 'USER' });
  });

  it('should call DELETE /api/usuarios/{id} to deactivate', (done) => {
    service.desativar(1).subscribe(() => done());

    const req = httpMock.expectOne('/api/usuarios/1');
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });

  it('should reactivate through PATCH with ativo true', (done) => {
    service.ativar(1).subscribe(() => done());

    const req = httpMock.expectOne('/api/usuarios/1');
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({ ativo: true });
    req.flush(mockUsuario);
  });

  it('should propagate the 409 of the last active administrator', (done) => {
    service.desativar(1).subscribe({
      error: (err) => {
        expect(err.status).toBe(409);
        done();
      }
    });

    httpMock.expectOne('/api/usuarios/1').flush(
      { mensagem: 'Nao e possivel desativar o ultimo administrador ativo.' },
      { status: 409, statusText: 'Conflict' }
    );
  });
});
