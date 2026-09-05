import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

/**
 * Barra da landing. A navbar do sistema só existe autenticada (`@if` no `AppComponent`) e a
 * landing roda em layout fluido, sem ela — então a página pública traz a própria barra, com
 * marca, um atalho para o "Como funciona" e a entrada.
 */
@Component({
  selector: 'app-landing-topo',
  imports: [RouterLink],
  templateUrl: './landing-topo.component.html',
  styleUrl: './landing-topo.component.scss'
})
export class LandingTopoComponent {}
