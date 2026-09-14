import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { ThemeService } from '../../../../core/services/theme.service';
import { LandingTopoComponent } from './landing-topo.component';

describe('LandingTopoComponent', () => {
  let fixture: ComponentFixture<LandingTopoComponent>;
  let elemento: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LandingTopoComponent],
      providers: [
        provideRouter([]),
        {
          provide: ThemeService,
          useValue: jasmine.createSpyObj<ThemeService>('ThemeService', ['alternar'], {
            escuro: signal(true).asReadonly()
          } as Partial<ThemeService>)
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(LandingTopoComponent);
    fixture.detectChanges();
    elemento = fixture.nativeElement as HTMLElement;
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render the brand', () => {
    expect(elemento.querySelector('.topo__nome')?.textContent).toContain('Cartola');
  });

  it('should send the visitor to the login screen', () => {
    expect(elemento.querySelector('a.btn-primary')?.getAttribute('href')).toBe('/login');
  });

  // Sem sessão a landing é a primeira tela: a escolha de tema não pode esperar o login.
  it('should offer the theme toggle', () => {
    expect(elemento.querySelector('app-tema-toggle .btn-tema')).toBeTruthy();
  });

  it('should anchor the how-it-works link to the section id used by the page', () => {
    expect(elemento.querySelector('.topo__link')?.getAttribute('href')).toBe('#como-funciona');
  });
});
