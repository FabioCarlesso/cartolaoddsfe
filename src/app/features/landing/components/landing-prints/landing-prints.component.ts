import { Component } from '@angular/core';

/** Captura de uma tela real da aplicação. */
export interface PrintLanding {
  arquivo: string;
  /** Descrição do conteúdo da imagem para quem não a enxerga (WCAG 1.1.1). */
  alt: string;
  legenda: string;
  largura: number;
  altura: number;
  /** Ocupa a linha inteira da galeria, em vez de meia. */
  destaque?: boolean;
}

/**
 * Capturas das telas reais, feitas contra uma API de demonstração com dados fictícios: a página
 * é pública e não faz sentido expor uma rodada de verdade nem gastar cota da Odds API para
 * tirar print. Como refazer as imagens é manual, o procedimento está em
 * `docs/prints-da-landing.md` — PR que muda a aparência de uma dessas telas refaz o print.
 *
 * `largura`/`altura` são as dimensões reais dos arquivos em `src/assets/landing/` e existem
 * para o navegador reservar o espaço antes do download, sem deslocar o layout na rolagem.
 */
@Component({
  selector: 'app-landing-prints',
  imports: [],
  templateUrl: './landing-prints.component.html',
  styleUrl: './landing-prints.component.scss'
})
export class LandingPrintsComponent {
  readonly prints: PrintLanding[] = [
    {
      arquivo: 'time',
      alt: 'Tela do time da rodada: escalação 4-3-3 desenhada no campo, com capitão, reserva de luxo, custo total e saldo de cartoletas.',
      legenda: 'Time da rodada: a escalação montada, no campo, com custo e saldo.',
      largura: 1440,
      altura: 900,
      destaque: true
    },
    {
      arquivo: 'ranking',
      alt: 'Tela de ranking de atletas: tabela ordenada por score, com filtro por posição, preço, média de pontos e o badge de consistência de cada jogador.',
      legenda: 'Ranking: todos os atletas por score, com o indicador de consistência.',
      largura: 1440,
      altura: 900
    },
    {
      arquivo: 'comparar',
      alt: 'Tela de comparação de formações: cards das formações escolhidas ranqueados por score total, com medalhas nas três primeiras posições.',
      legenda: 'Comparação: até cinco formações lado a lado, ranqueadas por score.',
      largura: 1440,
      altura: 900
    },
    {
      arquivo: 'historico',
      alt: 'Tela de histórico por rodada: cada rodada com o score sugerido ao lado da pontuação real obtida pelos atletas escalados.',
      legenda: 'Histórico: o que foi sugerido ao lado do que a rodada realmente rendeu.',
      largura: 1440,
      altura: 900,
      destaque: true
    }
  ];

  caminho(print: PrintLanding): string {
    return `assets/landing/${print.arquivo}.webp`;
  }
}
