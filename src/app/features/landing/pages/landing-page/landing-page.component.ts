import { Component } from '@angular/core';
import { LandingComoFuncionaComponent } from '../../components/landing-como-funciona/landing-como-funciona.component';
import { LandingFuncionalidadesComponent } from '../../components/landing-funcionalidades/landing-funcionalidades.component';
import { LandingHeroComponent } from '../../components/landing-hero/landing-hero.component';
import { LandingPrintsComponent } from '../../components/landing-prints/landing-prints.component';
import { LandingRodapeComponent } from '../../components/landing-rodape/landing-rodape.component';
import { LandingTecnologiaComponent } from '../../components/landing-tecnologia/landing-tecnologia.component';
import { LandingTopoComponent } from '../../components/landing-topo/landing-topo.component';

/**
 * Página pública da raiz. Nenhum componente daqui injeta serviço que chame `/api`, e isso é
 * requisito, não detalhe: a landing é a primeira tela de quem chega pelo link — inclusive de um
 * recrutador — e precisa aparecer inteira mesmo com o backend fora do ar ou em cold start.
 */
@Component({
  selector: 'app-landing-page',
  imports: [
    LandingTopoComponent,
    LandingHeroComponent,
    LandingComoFuncionaComponent,
    LandingFuncionalidadesComponent,
    LandingPrintsComponent,
    LandingTecnologiaComponent,
    LandingRodapeComponent
  ],
  templateUrl: './landing-page.component.html',
  styleUrl: './landing-page.component.scss'
})
export class LandingPageComponent {}
