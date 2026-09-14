import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TemaToggleComponent } from '../../../../shared/components/tema-toggle/tema-toggle.component';

/**
 * Barra da landing. A navbar do sistema só existe autenticada (`@if` no `AppComponent`) e a
 * landing roda em layout fluido, sem ela — então a página pública traz a própria barra, com
 * marca, um atalho para o "Como funciona", a entrada e o botão de tema — quem chega sem sessão
 * também escolhe o tema já na primeira tela.
 */
@Component({
  selector: 'app-landing-topo',
  imports: [RouterLink, TemaToggleComponent],
  templateUrl: './landing-topo.component.html',
  styleUrl: './landing-topo.component.scss'
})
export class LandingTopoComponent {}
