import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { AlterarSenhaPageComponent } from './alterar-senha-page.component';
import { AuthService } from '../../../../core/services/auth.service';

describe('AlterarSenhaPageComponent', () => {
  let fixture: ComponentFixture<AlterarSenhaPageComponent>;
  let component: AlterarSenhaPageComponent;
  let authService: jasmine.SpyObj<AuthService>;

  beforeEach(async () => {
    authService = jasmine.createSpyObj('AuthService', ['alterarSenha', 'encerrarSessaoAposTrocaDeSenha']);

    await TestBed.configureTestingModule({
      imports: [AlterarSenhaPageComponent],
      providers: [{ provide: AuthService, useValue: authService }]
    }).compileComponents();

    fixture = TestBed.createComponent(AlterarSenhaPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should not call the API when the passwords do not match', () => {
    component.form.setValue({
      senhaAtual: 'atual-123',
      novaSenha: 'nova-senha-456',
      confirmacao: 'nova-senha-789'
    });

    component.salvar();

    expect(authService.alterarSenha).not.toHaveBeenCalled();
    expect(component.form.hasError('senhasDiferentes')).toBeTrue();
  });

  it('should not call the API when the new password is too short', () => {
    component.form.setValue({ senhaAtual: 'atual-123', novaSenha: 'curta', confirmacao: 'curta' });

    component.salvar();

    expect(authService.alterarSenha).not.toHaveBeenCalled();
  });

  it('should send only senhaAtual and novaSenha and end the session', () => {
    authService.alterarSenha.and.returnValue(of(undefined));
    component.form.setValue({
      senhaAtual: 'atual-123',
      novaSenha: 'nova-senha-456',
      confirmacao: 'nova-senha-456'
    });

    component.salvar();

    expect(authService.alterarSenha).toHaveBeenCalledWith({
      senhaAtual: 'atual-123',
      novaSenha: 'nova-senha-456'
    });
    expect(component.sucesso).toBeTrue();
    // A confirmação aparece na tela de login: aqui a navegação acontece no mesmo instante.
    expect(authService.encerrarSessaoAposTrocaDeSenha).toHaveBeenCalled();
  });

  it('should show the API message when the current password is wrong', () => {
    authService.alterarSenha.and.returnValue(
      throwError(() => ({ status: 422, userMessage: 'Senha atual incorreta.' }))
    );
    component.form.setValue({
      senhaAtual: 'errada',
      novaSenha: 'nova-senha-456',
      confirmacao: 'nova-senha-456'
    });

    component.salvar();
    fixture.detectChanges();

    expect(component.erro).toBe('Senha atual incorreta.');
    expect(authService.encerrarSessaoAposTrocaDeSenha).not.toHaveBeenCalled();
    expect(fixture.nativeElement.querySelector('.alert-error').textContent).toContain('incorreta');
  });
});
