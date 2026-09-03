import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import { of, throwError } from 'rxjs';
import { UsuarioFormPageComponent } from './usuario-form-page.component';
import { UsuarioService } from '../../services/usuario.service';
import { Usuario } from '../../../../core/models/usuario.model';

const existente: Usuario = {
  id: 2,
  nome: 'Ana',
  email: 'ana@cartolaodds.local',
  perfil: 'USER',
  ativo: true,
  criadoEm: '2026-02-01T10:00:00'
};

describe('UsuarioFormPageComponent', () => {
  let fixture: ComponentFixture<UsuarioFormPageComponent>;
  let component: UsuarioFormPageComponent;
  let usuarioService: jasmine.SpyObj<UsuarioService>;
  let router: jasmine.SpyObj<Router>;

  async function montar(params: Record<string, string> = {}): Promise<void> {
    TestBed.resetTestingModule();
    usuarioService = jasmine.createSpyObj('UsuarioService', ['criar', 'atualizar', 'buscarPorId']);
    usuarioService.criar.and.returnValue(of(existente));
    usuarioService.atualizar.and.returnValue(of(existente));
    usuarioService.buscarPorId.and.returnValue(of(existente));
    router = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [UsuarioFormPageComponent],
      providers: [
        { provide: UsuarioService, useValue: usuarioService },
        { provide: Router, useValue: router },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap(params) } } }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(UsuarioFormPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  describe('criação', () => {
    beforeEach(() => montar());

    it('should create', () => {
      expect(component).toBeTruthy();
      expect(component.edicao).toBeFalse();
    });

    it('should require the password field', () => {
      expect(fixture.nativeElement.querySelector('#senha')).toBeTruthy();

      component.form.patchValue({
        nome: 'Novo',
        email: 'novo@cartolaodds.local',
        senha: 'curta',
        perfil: 'USER'
      });
      component.salvar();

      expect(usuarioService.criar).not.toHaveBeenCalled();
    });

    it('should not call the API with an invalid e-mail', () => {
      component.form.patchValue({
        nome: 'Novo',
        email: 'nao-e-email',
        senha: 'senha-forte-123',
        perfil: 'USER'
      });
      component.salvar();

      expect(usuarioService.criar).not.toHaveBeenCalled();
    });

    it('should create the user, trimming the name, and go back to the list', () => {
      component.form.patchValue({
        nome: '  Novo  ',
        email: 'novo@cartolaodds.local',
        senha: 'senha-forte-123',
        perfil: 'ADMIN'
      });
      component.salvar();

      expect(usuarioService.criar).toHaveBeenCalledWith({
        nome: 'Novo',
        email: 'novo@cartolaodds.local',
        senha: 'senha-forte-123',
        perfil: 'ADMIN'
      });
      expect(router.navigate).toHaveBeenCalledWith(['/usuarios']);
    });

    it('should show "E-mail já cadastrado." on 409', () => {
      usuarioService.criar.and.returnValue(
        throwError(() => ({
          status: 409,
          userMessage: 'Ja existe um usuario com o e-mail informado.'
        }))
      );
      component.form.patchValue({
        nome: 'Novo',
        email: 'ana@cartolaodds.local',
        senha: 'senha-forte-123',
        perfil: 'USER'
      });

      component.salvar();
      fixture.detectChanges();

      expect(component.erro).toBe('E-mail já cadastrado.');
      expect(router.navigate).not.toHaveBeenCalled();
      expect(fixture.nativeElement.querySelector('.alert-error').textContent).toContain(
        'E-mail já cadastrado.'
      );
    });
  });

  describe('edição', () => {
    beforeEach(() => montar({ id: '2' }));

    it('should load the user and fill the form', () => {
      expect(component.edicao).toBeTrue();
      expect(usuarioService.buscarPorId).toHaveBeenCalledWith(2);
      expect(component.form.controls.nome.value).toBe('Ana');
      expect(component.form.controls.email.value).toBe('ana@cartolaodds.local');
      expect(component.form.controls.perfil.value).toBe('USER');
    });

    it('should not show the password field', () => {
      expect(fixture.nativeElement.querySelector('#senha')).toBeNull();
      expect(component.form.controls.senha.disabled).toBeTrue();
    });

    it('should send only the changed fields', () => {
      component.form.patchValue({ perfil: 'ADMIN' });
      component.salvar();

      expect(usuarioService.atualizar).toHaveBeenCalledWith(2, { perfil: 'ADMIN' });
      expect(router.navigate).toHaveBeenCalledWith(['/usuarios']);
    });

    it('should send an empty patch when nothing changed', () => {
      component.salvar();
      expect(usuarioService.atualizar).toHaveBeenCalledWith(2, {});
    });

    it('should translate the 409 of a duplicated e-mail', () => {
      usuarioService.atualizar.and.returnValue(
        throwError(() => ({
          status: 409,
          userMessage: 'Ja existe um usuario com o e-mail informado.'
        }))
      );
      component.form.patchValue({ email: 'fabio@cartolaodds.local' });

      component.salvar();

      expect(component.erro).toBe('E-mail já cadastrado.');
    });

    it('should keep the API message for the other 409 rules', () => {
      usuarioService.atualizar.and.returnValue(
        throwError(() => ({
          status: 409,
          userMessage: 'Nao e possivel rebaixar o perfil do ultimo administrador ativo.'
        }))
      );
      component.form.patchValue({ perfil: 'USER' });

      component.salvar();

      expect(component.erro).toBe('Nao e possivel rebaixar o perfil do ultimo administrador ativo.');
    });

    it('should show the load error', async () => {
      TestBed.resetTestingModule();
      await montar({ id: '2' });
      usuarioService.buscarPorId.and.returnValue(
        throwError(() => ({ status: 404, userMessage: 'Usuário não encontrado.' }))
      );

      const outra = TestBed.createComponent(UsuarioFormPageComponent);
      outra.detectChanges();

      expect(outra.componentInstance.erroCarga).toBe('Usuário não encontrado.');
    });
  });
});
