import { Route } from '@angular/router';
import { routes } from './app.routes';

/**
 * O `<title>` estático do `index.html` é o da landing, e o `TitleStrategy` padrão do Angular só
 * o substitui nas rotas que declaram `title`. Uma rota sem título deixaria na aba o texto da
 * página pública — ou, pior, o da tela anterior.
 */
describe('routes', () => {
  const navegaveis = routes.filter((rota: Route) => rota.loadComponent);

  it('should declare a title for every navigable route', () => {
    for (const rota of navegaveis) {
      expect(rota.title).withContext(`rota sem título: /${rota.path}`).toBeTruthy();
    }
  });

  it('should prefix every title with the product name', () => {
    for (const rota of navegaveis) {
      expect(rota.title as string)
        .withContext(`rota /${rota.path}`)
        .toMatch(/^Cartola Odds — /);
    }
  });

  it('should keep the public headline as the title of the landing', () => {
    const raiz = routes.find((rota) => rota.path === '');
    expect(raiz?.title).toBe('Cartola Odds — o time da rodada montado com as odds do Brasileirão');
  });

  it('should send unknown URLs to the landing route', () => {
    expect(routes.find((rota) => rota.path === '**')?.redirectTo).toBe('');
  });
});
