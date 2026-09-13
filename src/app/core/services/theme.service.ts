import { DOCUMENT, Injectable, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export type Tema = 'claro' | 'escuro';

/** Mesma chave lida pelo script de boot do `index.html` — mudar aqui exige mudar lá. */
export const TEMA_KEY = 'cartolaodds.tema';

/** Atributo escrito no `<html>`; os blocos de paleta em `styles.scss` reagem a ele. */
const TEMA_ATTR = 'data-theme';

/**
 * Tema visual da aplicação: escuro (padrão histórico do produto) ou claro.
 *
 * A escolha do usuário vive no `localStorage` e vale entre sessões. Sem escolha manual, quem
 * decide é o `prefers-color-scheme` do sistema — e o serviço continua acompanhando a troca de
 * tema do SO enquanto a aba estiver aberta, o que é o comportamento esperado de quem só usa o
 * modo automático do sistema operacional.
 *
 * O primeiro paint não passa por aqui: o script inline do `index.html` já escreve o atributo
 * no `<html>` antes de o Angular subir, senão a tela piscaria no tema errado. Este serviço é a
 * mesma decisão, agora em signal, para o cabeçalho reagir e o clique ter onde ser tratado.
 */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly document = inject(DOCUMENT);
  private readonly navegador = isPlatformBrowser(inject(PLATFORM_ID));

  /**
   * Guardada num campo, e não consultada a cada uso: um `MediaQueryList` sem referência viva
   * pode ser coletado, e o ouvinte da troca de tema do sistema morre junto com ele.
   */
  private readonly consultaTemaClaro = this.criarConsultaDeTemaClaro();

  /**
   * O usuário já escolheu um tema — nesta sessão ou numa anterior. Não dá para perguntar isso
   * só ao `localStorage`: com o storage bloqueado a escolha não tem onde ser gravada, e a
   * primeira troca de tema do sistema desfaria o que o usuário acabou de pedir.
   */
  private escolhaManual = false;

  private readonly tema = signal<Tema>('escuro');

  readonly temaAtual = this.tema.asReadonly();
  readonly escuro = computed(() => this.tema() === 'escuro');

  constructor() {
    this.tema.set(this.temaInicial());
    this.aplicar(this.tema());
    this.acompanharSistema();
  }

  /** Troca o tema e grava a escolha — a partir daqui o sistema deixa de mandar. */
  alternar(): void {
    this.definir(this.tema() === 'escuro' ? 'claro' : 'escuro');
  }

  definir(tema: Tema): void {
    gravarEscolha(tema);
    this.escolhaManual = true;
    this.tema.set(tema);
    this.aplicar(tema);
  }

  private temaInicial(): Tema {
    if (!this.navegador) {
      // No prerender não há storage nem sistema para consultar: o HTML sai sem o atributo e
      // quem decide é o script de boot, já no navegador de quem abriu a página.
      return 'escuro';
    }

    const escolha = lerEscolha();
    this.escolhaManual = escolha !== null;
    return escolha ?? this.temaDoSistema();
  }

  private temaDoSistema(): Tema {
    return this.consultaTemaClaro?.matches ? 'claro' : 'escuro';
  }

  private criarConsultaDeTemaClaro(): MediaQueryList | null {
    const janela = this.document.defaultView;
    return janela?.matchMedia ? janela.matchMedia('(prefers-color-scheme: light)') : null;
  }

  /**
   * Troca de tema no sistema operacional só move a aplicação enquanto o usuário não tiver
   * escolhido: quem clicou no botão pediu um tema, não "o tema do sistema" — e isso vale
   * mesmo quando a escolha não pôde ser gravada.
   */
  private acompanharSistema(): void {
    if (!this.navegador) {
      return;
    }

    this.consultaTemaClaro?.addEventListener('change', (evento) => {
      if (!this.escolhaManual) {
        this.tema.set(evento.matches ? 'claro' : 'escuro');
        this.aplicar(this.tema());
      }
    });
  }

  private aplicar(tema: Tema): void {
    if (!this.navegador) {
      return;
    }

    this.document.documentElement.setAttribute(TEMA_ATTR, tema);

    // A barra do navegador no mobile acompanha a página; sem isso o topo do celular fica
    // escuro sobre uma tela clara.
    this.document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute('content', tema === 'claro' ? '#f1f5f9' : '#0a0f1a');
  }
}

/**
 * O acesso ao storage é protegido porque navegador em modo privado ou com storage de site
 * bloqueado lança já na leitura. Aqui não há fallback em memória, ao contrário da sessão: sem
 * onde gravar, o tema volta a seguir o sistema no próximo carregamento — degradação aceitável
 * para uma preferência visual.
 */
function lerEscolha(): Tema | null {
  try {
    const valor = localStorage.getItem(TEMA_KEY);
    return valor === 'claro' || valor === 'escuro' ? valor : null;
  } catch {
    return null;
  }
}

function gravarEscolha(tema: Tema): void {
  try {
    localStorage.setItem(TEMA_KEY, tema);
  } catch {
    /* sem persistência disponível: o tema vale só enquanto a página estiver carregada */
  }
}
