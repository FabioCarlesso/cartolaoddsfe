import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LandingComoFuncionaComponent } from './landing-como-funciona.component';

describe('LandingComoFuncionaComponent', () => {
  let fixture: ComponentFixture<LandingComoFuncionaComponent>;
  let elemento: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LandingComoFuncionaComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(LandingComoFuncionaComponent);
    fixture.detectChanges();
    elemento = fixture.nativeElement as HTMLElement;
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  // O topo e o hero apontam para `#como-funciona`; sem o id, os dois links não levam a lugar
  // nenhum.
  it('should expose the anchor used by the page links', () => {
    expect(elemento.querySelector('#como-funciona')).toBeTruthy();
  });

  it('should render the pipeline as an ordered list of steps', () => {
    const passos = elemento.querySelectorAll('ol.como__passos > li');

    expect(passos.length).toBe(fixture.componentInstance.passos.length);
    expect(passos[0].textContent).toContain('Odds da rodada');
    expect(passos[passos.length - 1].textContent).toContain('Time escalado');
  });

  // O passo da probabilidade é o que traduz "odd" para quem nunca apostou — é o ponto em que a
  // página se mantém no nível do cartoleiro.
  it('should explain the odd in plain words', () => {
    expect(elemento.textContent).toContain('67%');
  });
});
