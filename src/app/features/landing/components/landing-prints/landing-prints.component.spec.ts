import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LandingPrintsComponent } from './landing-prints.component';

describe('LandingPrintsComponent', () => {
  let fixture: ComponentFixture<LandingPrintsComponent>;
  let elemento: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LandingPrintsComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(LandingPrintsComponent);
    fixture.detectChanges();
    elemento = fixture.nativeElement as HTMLElement;
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render one figure per screenshot', () => {
    expect(elemento.querySelectorAll('figure.print').length).toBe(
      fixture.componentInstance.prints.length
    );
  });

  /**
   * `loading="lazy"` mantém as imagens fora do carregamento inicial e `width`/`height` reservam
   * o espaço antes do download — sem os dois, a galeria pesa no Lighthouse e empurra o conteúdo
   * para baixo enquanto o usuário lê.
   */
  it('should lazy-load every screenshot with its intrinsic size and a descriptive alt', () => {
    const imagens = Array.from(elemento.querySelectorAll<HTMLImageElement>('img.print__imagem'));

    expect(imagens.length).toBeGreaterThan(0);
    for (const imagem of imagens) {
      expect(imagem.getAttribute('loading')).toBe('lazy');
      expect(imagem.getAttribute('width')).toBeTruthy();
      expect(imagem.getAttribute('height')).toBeTruthy();
      expect((imagem.getAttribute('alt') ?? '').length).toBeGreaterThan(20);
      expect(imagem.getAttribute('src')).toMatch(/^assets\/landing\/.+\.webp$/);
    }
  });
});
