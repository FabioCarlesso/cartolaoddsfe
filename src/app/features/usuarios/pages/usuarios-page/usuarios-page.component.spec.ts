import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { UsuariosPageComponent } from './usuarios-page.component';
import { UsuarioService } from '../../services/usuario.service';
import { AuthService } from '../../../../core/services/auth.service';
import { Pagina, Usuario } from '../../../../core/models/usuario.model';

const admin: Usuario = {
  id: 1,
  nome: 'Fabio Carlesso',
  email: 'fabio@cartolaodds.local',
  perfil: 'ADMIN',
  ativo: true,
  criadoEm: '2026-01-15T10:00:00'
};

const usuarioComum: Usuario = {
  id: 2,
  nome: 'Ana',
  email: 'ana@cartolaodds.local',
  perfil: 'USER',
  ativo: true,
  criadoEm: '2026-02-01T10:00:00'
};

const inativo: Usuario = { ...usuarioComum, id: 3, nome: 'Bruno', ativo: false };

function pagina(conteudo: Usuario[]): Pagina<Usuario> {
  return {
    conteudo,
    pagina: 0,
    tamanho: 100,
    totalElementos: conteudo.length,
    totalPaginas: 1,
    ultima: true
  };
}

describe('UsuariosPageComponent', () => {
  let fixture: ComponentFixture<UsuariosPageComponent>;
  let component: UsuariosPageComponent;
  let usuarioService: jasmine.SpyObj<UsuarioService>;

  beforeEach(async () => {
    usuarioService = jasmine.createSpyObj('UsuarioService', ['listar', 'desativar', 'ativar']);
    usuarioService.listar.and.returnValue(of(pagina([admin, usuarioComum, inativo])));
    usuarioService.desativar.and.returnValue(of(undefined));
    usuarioService.ativar.and.returnValue(of(inativo));

    const authService = jasmine.createSpyObj('AuthService', ['getUsuarioAtual']);
    authService.getUsuarioAtual.and.returnValue({
      usuarioId: 1,
      email: admin.email,
      nome: admin.nome,
      perfil: 'ADMIN'
    });

    await TestBed.configureTestingModule({
      imports: [UsuariosPageComponent],
      providers: [
        provideRouter([]),
        { provide: UsuarioService, useValue: usuarioService },
        { provide: AuthService, useValue: authService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(UsuariosPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should list the users on init', () => {
    expect(usuarioService.listar).toHaveBeenCalled();
    expect(fixture.nativeElement.querySelectorAll('tbody tr').length).toBe(3);
  });

  it('should show name, e-mail, perfil and situação', () => {
    const primeira = fixture.nativeElement.querySelectorAll('tbody tr')[0].textContent as string;
    expect(primeira).toContain('Fabio Carlesso');
    expect(primeira).toContain('fabio@cartolaodds.local');
    expect(primeira).toContain('ADMIN');
    expect(primeira).toContain('Ativo');
  });

  it('should never show a password column', () => {
    const tabela = fixture.nativeElement.querySelector('.usuarios-table').textContent as string;
    expect(tabela.toLowerCase()).not.toContain('senha');
  });

  it('should offer Ativar for an inactive user and Desativar for an active one', () => {
    const linhas = fixture.nativeElement.querySelectorAll('tbody tr');
    expect(linhas[1].textContent).toContain('Desativar');
    expect(linhas[2].textContent).toContain('Ativar');
  });

  it('should ask for confirmation before deactivating', () => {
    component.pedirConfirmacao(usuarioComum);
    fixture.detectChanges();

    expect(usuarioService.desativar).not.toHaveBeenCalled();
    expect(fixture.nativeElement.querySelector('.modal-title').textContent).toContain(
      'Desativar usuário'
    );
  });

  it('should not deactivate when the confirmation is cancelled', () => {
    component.pedirConfirmacao(usuarioComum);
    component.cancelarDesativacao();
    fixture.detectChanges();

    expect(usuarioService.desativar).not.toHaveBeenCalled();
    expect(fixture.nativeElement.querySelector('.modal')).toBeNull();
  });

  it('should deactivate and reload after confirmation', () => {
    component.pedirConfirmacao(usuarioComum);
    component.confirmarDesativacao();

    expect(usuarioService.desativar).toHaveBeenCalledWith(2);
    expect(usuarioService.listar).toHaveBeenCalledTimes(2);
    expect(component.mensagem).toContain('Ana');
    expect(component.confirmando).toBeNull();
  });

  it('should show the API message when deactivating the last administrator', () => {
    usuarioService.desativar.and.returnValue(
      throwError(() => ({
        status: 409,
        userMessage: 'Nao e possivel desativar o ultimo administrador ativo.'
      }))
    );

    component.pedirConfirmacao(admin);
    component.confirmarDesativacao();
    fixture.detectChanges();

    expect(component.erroAcao).toContain('ultimo administrador ativo');
    expect(fixture.nativeElement.querySelector('.alert-error').textContent).toContain(
      'ultimo administrador ativo'
    );
  });

  it('should reactivate an inactive user without confirmation', () => {
    component.ativar(inativo);

    expect(usuarioService.ativar).toHaveBeenCalledWith(3);
    expect(component.mensagem).toContain('Bruno');
  });

  it('should mark the logged user row', () => {
    expect(component.usuarioLogadoId).toBe(1);
    expect(fixture.nativeElement.querySelectorAll('.tag-voce').length).toBe(1);
  });

  it('should show the load error with a retry button', () => {
    usuarioService.listar.and.returnValue(
      throwError(() => ({ status: 500, userMessage: 'Erro interno do servidor.' }))
    );

    component.carregar();
    fixture.detectChanges();

    expect(component.erroCarga).toBe('Erro interno do servidor.');
    expect(fixture.nativeElement.querySelector('.error-state')).toBeTruthy();
  });

  it('should show the empty state when there is no user', () => {
    usuarioService.listar.and.returnValue(of(pagina([])));

    component.carregar();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.empty-title').textContent).toContain(
      'Nenhum usuário cadastrado'
    );
  });
});
