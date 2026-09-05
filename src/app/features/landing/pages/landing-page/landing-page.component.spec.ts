import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { LandingPageComponent } from './landing-page.component';

describe('LandingPageComponent', () => {
  let fixture: ComponentFixture<LandingPageComponent>;
  let elemento: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LandingPageComponent],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()]
    }).compileComponents();

    fixture = TestBed.createComponent(LandingPageComponent);
    fixture.detectChanges();
    elemento = fixture.nativeElement as HTMLElement;
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  /**
   * A landing é a primeira tela de quem chega pelo link, inclusive com o backend em cold start
   * ou fora do ar: renderizar não pode custar uma chamada a `/api`. O `verify()` falha se
   * qualquer faixa tiver aberto uma requisição durante a montagem.
   */
  it('should render without issuing a single HTTP request', () => {
    expect(elemento.querySelector('.landing')).toBeTruthy();
    TestBed.inject(HttpTestingController).verify();
  });

  it('should render every landing band, in order', () => {
    const faixas = Array.from(elemento.querySelectorAll('.landing > *')).map((faixa) =>
      faixa.tagName.toLowerCase()
    );

    expect(faixas).toEqual([
      'app-landing-topo',
      'app-landing-hero',
      'app-landing-como-funciona',
      'app-landing-funcionalidades',
      'app-landing-prints',
      'app-landing-tecnologia',
      'app-landing-rodape'
    ]);
  });

  it('should render a single h1', () => {
    expect(elemento.querySelectorAll('h1').length).toBe(1);
  });

  // O `<main>` já vem do `AppComponent`, que envolve o `<router-outlet>`. Um segundo aqui
  // dentro aninharia landmarks — inválido em HTML e ambíguo para o leitor de tela.
  it('should not declare its own main landmark', () => {
    expect(elemento.querySelector('main')).toBeNull();
  });

  it('should give every section an existing heading as accessible name', () => {
    for (const secao of Array.from(elemento.querySelectorAll('section'))) {
      const id = secao.getAttribute('aria-labelledby');
      expect(id).withContext('seção sem aria-labelledby').toBeTruthy();
      expect(elemento.querySelector(`#${id}`))
        .withContext(`nenhum título com id ${id}`)
        .toBeTruthy();
    }
  });

  // Não há auto-cadastro: as contas são criadas por um administrador, e a página pública não
  // pode prometer o contrário.
  it('should not promise self-signup', () => {
    const texto = (elemento.textContent ?? '').toLowerCase();

    for (const proibido of ['criar conta', 'cadastre-se', 'crie sua conta', 'teste grátis']) {
      expect(texto).withContext(`texto proibido na landing: ${proibido}`).not.toContain(proibido);
    }
  });
});
