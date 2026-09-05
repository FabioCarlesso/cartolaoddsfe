import { BootstrapContext, bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { config } from './app/app.config.server';

/**
 * Ponto de entrada do prerender da landing (ver `app.config.server.ts`). O `BootstrapContext`
 * é obrigatório fora do navegador: é ele que entrega a plataforma do servidor ao bootstrap.
 */
const bootstrap = (context: BootstrapContext) => bootstrapApplication(AppComponent, config, context);

export default bootstrap;
