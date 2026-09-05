import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LandingFuncionalidadesComponent } from './landing-funcionalidades.component';

describe('LandingFuncionalidadesComponent', () => {
  let fixture: ComponentFixture<LandingFuncionalidadesComponent>;
  let elemento: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LandingFuncionalidadesComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(LandingFuncionalidadesComponent);
    fixture.detectChanges();
    elemento = fixture.nativeElement as HTMLElement;
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render one card per capability', () => {
    expect(elemento.querySelectorAll('.funcs__lista > li').length).toBe(
      fixture.componentInstance.funcionalidades.length
    );
  });

  /**
   * Cada card precisa corresponder a uma tela ou parâmetro que existe hoje. Ao remover uma
   * dessas capacidades do produto, este teste é o lembrete de que a página pública também muda.
   */
  it('should cover the capabilities the system actually has', () => {
    const texto = elemento.textContent ?? '';

    for (const capacidade of [
      'Time da rodada',
      'cartoletas',
      'Comparação de formações',
      'Dúvidas',
      'Ranking',
      'Favoritos',
      'Histórico',
      'Regras'
    ]) {
      expect(texto).withContext(`capacidade ausente na landing: ${capacidade}`).toContain(capacidade);
    }
  });
});
