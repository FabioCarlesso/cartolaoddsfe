import { Component } from '@angular/core';

/** Card de capacidade, escrito como benefício ao cartoleiro. */
export interface FuncionalidadeLanding {
  icone: string;
  titulo: string;
  texto: string;
}

/**
 * Cada card corresponde a uma capacidade que existe hoje no sistema — a página é pública e
 * serve de cartão de visita, então nada aqui pode ser promessa. Ao remover uma funcionalidade
 * do produto, o card sai junto.
 */
@Component({
  selector: 'app-landing-funcionalidades',
  imports: [],
  templateUrl: './landing-funcionalidades.component.html',
  styleUrl: './landing-funcionalidades.component.scss'
})
export class LandingFuncionalidadesComponent {
  readonly funcionalidades: FuncionalidadeLanding[] = [
    {
      icone: '⚽',
      titulo: 'Time da rodada pronto',
      texto:
        'A escalação completa na formação que você escolher, com capitão e reserva de luxo já indicados.'
    },
    {
      icone: '💰',
      titulo: 'Teto de cartoletas',
      texto:
        'Informe quanto tem para gastar e receba o time de maior score que cabe no orçamento — a busca testa as combinações, não escolhe pelo caminho mais fácil.'
    },
    {
      icone: '⚖️',
      titulo: 'Comparação de formações',
      texto:
        'Até cinco formações montadas ao mesmo tempo, ranqueadas por score, para você ver qual rende mais nesta rodada.'
    },
    {
      icone: '⚠️',
      titulo: 'Dúvidas fora do caminho',
      texto:
        'Jogadores em dúvida podem ser excluídos do time e do ranking, e quem fica em dúvida vem com o substituto provável ao lado.'
    },
    {
      icone: '🏆',
      titulo: 'Ranking com consistência',
      texto:
        'Todos os atletas ordenados por score, com um indicador que separa quem pontua sempre de quem oscila entre 2 e 20.'
    },
    {
      icone: '⭐',
      titulo: 'Favoritos da rodada',
      texto:
        'Os jogos com as odds da rodada e a chance de vitória de cada time, para você conferir de onde veio a sugestão.'
    },
    {
      icone: '📈',
      titulo: 'Histórico que presta contas',
      texto:
        'Rodada a rodada, o score sugerido ao lado da pontuação que os atletas realmente fizeram. Dá para cobrar o sistema.'
    },
    {
      icone: '⚙️',
      titulo: 'Regras ajustáveis na hora',
      texto:
        'Pesos do score, limite de odd e formação padrão mudam pelo painel e valem na próxima consulta, sem reiniciar nada.'
    }
  ];
}
