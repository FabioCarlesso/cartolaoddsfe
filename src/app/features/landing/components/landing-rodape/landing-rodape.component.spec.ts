import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LandingRodapeComponent } from './landing-rodape.component';

describe('LandingRodapeComponent', () => {
  let fixture: ComponentFixture<LandingRodapeComponent>;
  let elemento: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LandingRodapeComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(LandingRodapeComponent);
    fixture.detectChanges();
    elemento = fixture.nativeElement as HTMLElement;
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render authorship, the current year and the license', () => {
    const texto = elemento.textContent ?? '';

    expect(texto).toContain('Fabio Carlesso');
    expect(texto).toContain(String(new Date().getFullYear()));
    expect(texto).toContain('MIT');
  });

  /**
   * O sistema usa a marca do Cartola FC e odds de casas de aposta: o desvínculo precisa estar
   * escrito na própria página pública, não só no README.
   */
  it('should state that the project has no ties to Globo, Cartola FC or bookmakers', () => {
    const aviso = elemento.querySelector('.rodape__aviso')?.textContent ?? '';

    expect(aviso).toContain('Globo');
    expect(aviso).toContain('Cartola FC');
    expect(aviso).toContain('casas de aposta');
  });
});
