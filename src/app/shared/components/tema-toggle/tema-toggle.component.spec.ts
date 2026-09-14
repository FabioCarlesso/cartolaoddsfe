import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { ThemeService } from '../../../core/services/theme.service';
import { TemaToggleComponent } from './tema-toggle.component';

describe('TemaToggleComponent', () => {
  let fixture: ComponentFixture<TemaToggleComponent>;
  let themeService: jasmine.SpyObj<ThemeService>;
  let escuro: ReturnType<typeof signal<boolean>>;
  let botao: HTMLButtonElement;

  beforeEach(async () => {
    escuro = signal(true);
    themeService = jasmine.createSpyObj<ThemeService>('ThemeService', ['alternar'], {
      escuro: escuro.asReadonly()
    } as Partial<ThemeService>);

    await TestBed.configureTestingModule({
      imports: [TemaToggleComponent],
      providers: [{ provide: ThemeService, useValue: themeService }]
    }).compileComponents();

    fixture = TestBed.createComponent(TemaToggleComponent);
    fixture.detectChanges();
    botao = fixture.nativeElement.querySelector('.btn-tema');
  });

  afterEach(() => document.documentElement.removeAttribute('data-theme'));

  it('should toggle the theme on click', () => {
    botao.click();
    expect(themeService.alternar).toHaveBeenCalled();
  });

  // O botão anuncia o destino da troca, não o tema em que a tela está — e sem `aria-pressed`.
  it('should announce the theme the button switches to', () => {
    expect(botao.getAttribute('aria-label')).toBe('Mudar para o tema claro');
    expect(botao.hasAttribute('aria-pressed')).toBeFalse();

    escuro.set(false);
    fixture.detectChanges();

    expect(botao.getAttribute('aria-label')).toBe('Mudar para o tema escuro');
  });

  /*
   * O ícone segue o atributo do `<html>`, e não o signal: a landing chega do prerender com o
   * HTML do tema escuro, e o script de boot marca o tema antes de o Angular hidratar a página.
   */
  it('should pick the icon from the data-theme attribute', () => {
    const visivel = (seletor: string) =>
      getComputedStyle(fixture.nativeElement.querySelector(seletor)).display !== 'none';

    document.documentElement.setAttribute('data-theme', 'escuro');
    expect(visivel('.tema-icone--sol')).toBeTrue();
    expect(visivel('.tema-icone--lua')).toBeFalse();

    document.documentElement.setAttribute('data-theme', 'claro');
    expect(visivel('.tema-icone--sol')).toBeFalse();
    expect(visivel('.tema-icone--lua')).toBeTrue();
  });
});
