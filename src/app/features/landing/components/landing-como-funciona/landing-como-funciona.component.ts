import { Component } from '@angular/core';

/** Um passo do pipeline, da odd bruta até o time escalado. */
export interface PassoLanding {
  icone: string;
  titulo: string;
  texto: string;
}

/**
 * Explica a mecânica sem exigir vocabulário de aposta: cada passo é escrito na ordem em que o
 * backend executa (odds → probabilidade implícita → score por atleta → montagem).
 */
@Component({
  selector: 'app-landing-como-funciona',
  imports: [],
  templateUrl: './landing-como-funciona.component.html',
  styleUrl: './landing-como-funciona.component.scss'
})
export class LandingComoFuncionaComponent {
  readonly passos: PassoLanding[] = [
    {
      icone: '📊',
      titulo: 'Odds da rodada',
      texto:
        'O sistema busca as cotações do Brasileirão nas casas de aposta para cada jogo da rodada.'
    },
    {
      icone: '🎯',
      titulo: 'Chance de vitória',
      texto:
        'A cotação vira probabilidade: uma odd de 1,50 equivale a cerca de 67% de chance. É assim que o time favorito aparece.'
    },
    {
      icone: '⚽',
      titulo: 'Score do atleta',
      texto:
        'Cada jogador recebe uma nota que junta o favoritismo do seu time, a média das últimas cinco rodadas e a regularidade dessas notas.'
    },
    {
      icone: '📋',
      titulo: 'Time escalado',
      texto:
        'A escalação sai do maior score possível respeitando a formação, o teto de cartoletas e as regras de montagem — capitão e reserva de luxo incluídos.'
    }
  ];
}
