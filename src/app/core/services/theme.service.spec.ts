import { DOCUMENT } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { TEMA_KEY, Tema, ThemeService } from './theme.service';

/** `MediaQueryList` de mentira: o teste decide o que o sistema responde e quando ele muda. */
class ConsultaFalsa {
  matches: boolean;
  private ouvintes: ((evento: MediaQueryListEvent) => void)[] = [];

  constructor(matches: boolean) {
    this.matches = matches;
  }

  addEventListener(_: string, ouvinte: (evento: MediaQueryListEvent) => void): void {
    this.ouvintes.push(ouvinte);
  }

  /** Simula o usuário trocando o tema no sistema operacional com a aba aberta. */
  emitir(matches: boolean): void {
    this.matches = matches;
    this.ouvintes.forEach((ouvinte) => ouvinte({ matches } as MediaQueryListEvent));
  }
}

describe('ThemeService', () => {
  let html: HTMLElement;
  let meta: HTMLMetaElement;
  let consulta: ConsultaFalsa;

  /**
   * Monta o serviço sobre um documento de mentira — assim o teste lê o atributo escrito sem
   * mexer no `<html>` da página do Karma, e controla o que o `prefers-color-scheme` responde.
   */
  function criar(opcoes: { sistemaClaro?: boolean; escolha?: Tema } = {}): ThemeService {
    if (opcoes.escolha) {
      localStorage.setItem(TEMA_KEY, opcoes.escolha);
    }

    html = document.createElement('html');
    meta = document.createElement('meta');
    meta.setAttribute('name', 'theme-color');
    meta.setAttribute('content', '#0a0f1a');
    consulta = new ConsultaFalsa(opcoes.sistemaClaro === true);

    const documentoFalso = {
      documentElement: html,
      defaultView: { matchMedia: () => consulta },
      querySelector: (seletor: string) => (seletor === 'meta[name="theme-color"]' ? meta : null)
    } as unknown as Document;

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [{ provide: DOCUMENT, useValue: documentoFalso }] });
    return TestBed.inject(ThemeService);
  }

  beforeEach(() => localStorage.removeItem(TEMA_KEY));
  afterEach(() => localStorage.removeItem(TEMA_KEY));

  it('should default to the dark theme when the system does not ask for light', () => {
    const servico = criar({ sistemaClaro: false });

    expect(servico.temaAtual()).toBe('escuro');
    expect(servico.escuro()).toBeTrue();
    expect(html.getAttribute('data-theme')).toBe('escuro');
  });

  it('should follow prefers-color-scheme when the user never chose', () => {
    const servico = criar({ sistemaClaro: true });

    expect(servico.temaAtual()).toBe('claro');
    expect(html.getAttribute('data-theme')).toBe('claro');
  });

  it('should prefer the stored choice over the system preference', () => {
    const servico = criar({ sistemaClaro: true, escolha: 'escuro' });

    expect(servico.temaAtual()).toBe('escuro');
    expect(html.getAttribute('data-theme')).toBe('escuro');
  });

  it('should toggle the theme and persist the choice', () => {
    const servico = criar({ sistemaClaro: false });

    servico.alternar();

    expect(servico.temaAtual()).toBe('claro');
    expect(html.getAttribute('data-theme')).toBe('claro');
    expect(localStorage.getItem(TEMA_KEY)).toBe('claro');

    servico.alternar();

    expect(servico.temaAtual()).toBe('escuro');
    expect(localStorage.getItem(TEMA_KEY)).toBe('escuro');
  });

  it('should keep the browser chrome in sync through the theme-color meta tag', () => {
    const servico = criar({ sistemaClaro: false });

    servico.definir('claro');
    expect(meta.getAttribute('content')).toBe('#f1f5f9');

    servico.definir('escuro');
    expect(meta.getAttribute('content')).toBe('#0a0f1a');
  });

  it('should follow later system changes while there is no manual choice', () => {
    const servico = criar({ sistemaClaro: false });

    consulta.emitir(true);

    expect(servico.temaAtual()).toBe('claro');
    expect(html.getAttribute('data-theme')).toBe('claro');
  });

  // Quem clicou no botão pediu um tema, não "o tema do sistema".
  it('should stop following the system once the user chose a theme', () => {
    const servico = criar({ sistemaClaro: false });
    servico.definir('escuro');

    consulta.emitir(true);

    expect(servico.temaAtual()).toBe('escuro');
  });

  /*
   * Com o storage bloqueado a escolha não tem onde ser gravada — mas ela continua valendo
   * enquanto a página viver. Sem essa marca em memória, a primeira troca de tema no sistema
   * desfazia o que o usuário tinha acabado de pedir no botão.
   */
  it('should honour a manual choice that could not be stored', () => {
    spyOn(Storage.prototype, 'setItem').and.throwError('storage bloqueado');

    const servico = criar({ sistemaClaro: false });
    servico.definir('escuro');

    consulta.emitir(true);

    expect(servico.temaAtual()).toBe('escuro');
    expect(html.getAttribute('data-theme')).toBe('escuro');
  });

  // Navegador em modo privado ou com storage de site bloqueado lança já na leitura: sem
  // persistência o tema apenas volta a seguir o sistema, e nada pode quebrar por isso.
  it('should survive a blocked storage', () => {
    spyOn(Storage.prototype, 'getItem').and.throwError('storage bloqueado');
    spyOn(Storage.prototype, 'setItem').and.throwError('storage bloqueado');

    const servico = criar({ sistemaClaro: true });
    expect(servico.temaAtual()).toBe('claro');

    expect(() => servico.alternar()).not.toThrow();
    expect(servico.temaAtual()).toBe('escuro');
    expect(html.getAttribute('data-theme')).toBe('escuro');
  });
});
