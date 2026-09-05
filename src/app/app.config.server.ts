import { ApplicationConfig, mergeApplicationConfig } from '@angular/core';
import { provideServerRendering } from '@angular/platform-server';
import { appConfig } from './app.config';

/**
 * Configuração usada apenas no prerender da landing (`npm run build`). Não existe servidor Node
 * em produção: o build gera o HTML de `/` já pronto e o nginx continua servindo estático.
 */
const serverConfig: ApplicationConfig = {
  providers: [provideServerRendering()]
};

export const config = mergeApplicationConfig(appConfig, serverConfig);
