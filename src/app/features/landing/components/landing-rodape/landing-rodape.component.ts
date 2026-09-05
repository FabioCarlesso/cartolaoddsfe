import { Component } from '@angular/core';

/**
 * Rodapé da página pública. O aviso de desvínculo não é rodapé decorativo: o sistema usa a
 * marca do Cartola FC e odds de casas de aposta, e quem chega pelo link precisa ler, na
 * própria página, que este é um projeto pessoal sem relação com nenhum dos dois.
 */
@Component({
  selector: 'app-landing-rodape',
  imports: [],
  templateUrl: './landing-rodape.component.html',
  styleUrl: './landing-rodape.component.scss'
})
export class LandingRodapeComponent {
  readonly anoAtual = new Date().getFullYear();
  readonly autor = 'https://github.com/FabioCarlesso';
  readonly licenca = 'https://github.com/FabioCarlesso/cartolaoddsfe/blob/main/LICENSE';
}
