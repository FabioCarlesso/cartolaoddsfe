import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LandingTecnologiaComponent } from './landing-tecnologia.component';

describe('LandingTecnologiaComponent', () => {
  let fixture: ComponentFixture<LandingTecnologiaComponent>;
  let elemento: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LandingTecnologiaComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(LandingTecnologiaComponent);
    fixture.detectChanges();
    elemento = fixture.nativeElement as HTMLElement;
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render the stack of both sides', () => {
    const texto = elemento.textContent ?? '';

    expect(texto).toContain('Java 21');
    expect(texto).toContain('Angular 21');
    expect(texto).toContain('Docker');
  });

  it('should render one card per architecture decision', () => {
    expect(elemento.querySelectorAll('.tec__decisoes > li').length).toBe(
      fixture.componentInstance.decisoes.length
    );
  });

  it('should link both repositories, opening them safely in a new tab', () => {
    const links = Array.from(elemento.querySelectorAll<HTMLAnchorElement>('a.repo'));
    const urls = links.map((link) => link.getAttribute('href'));

    expect(urls).toEqual([
      'https://github.com/FabioCarlesso/cartolaoddsapi',
      'https://github.com/FabioCarlesso/cartolaoddsfe'
    ]);
    for (const link of links) {
      expect(link.getAttribute('rel')).toContain('noopener');
    }
  });
});
