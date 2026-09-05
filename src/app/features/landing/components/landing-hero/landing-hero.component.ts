import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

/** Faixa de abertura: o que o sistema faz, em uma frase que o cartoleiro entende sem glossário. */
@Component({
  selector: 'app-landing-hero',
  imports: [RouterLink],
  templateUrl: './landing-hero.component.html',
  styleUrl: './landing-hero.component.scss'
})
export class LandingHeroComponent {
  readonly repositorioFrontend = 'https://github.com/FabioCarlesso/cartolaoddsfe';
}
