import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { LandingHeroComponent } from './landing-hero.component';

describe('LandingHeroComponent', () => {
  let fixture: ComponentFixture<LandingHeroComponent>;
  let elemento: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LandingHeroComponent],
      providers: [provideRouter([])]
    }).compileComponents();

    fixture = TestBed.createComponent(LandingHeroComponent);
    fixture.detectChanges();
    elemento = fixture.nativeElement as HTMLElement;
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should state the value proposition in the only h1 of the section', () => {
    const titulos = elemento.querySelectorAll('h1');

    expect(titulos.length).toBe(1);
    expect(titulos[0].textContent).toContain('odds');
  });

  it('should offer the primary CTA to the login screen', () => {
    expect(elemento.querySelector('a.btn-primary')?.getAttribute('href')).toBe('/login');
  });

  // Link para fora abre em outra aba: sem `rel="noopener"` a página de destino ganha acesso ao
  // `window.opener` desta.
  it('should open the repository link safely in a new tab', () => {
    const link = elemento.querySelector<HTMLAnchorElement>('a.btn-secondary');

    expect(link?.getAttribute('href')).toContain('github.com/FabioCarlesso/cartolaoddsfe');
    expect(link?.getAttribute('target')).toBe('_blank');
    expect(link?.getAttribute('rel')).toContain('noopener');
  });
});
