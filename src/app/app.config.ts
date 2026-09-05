import { ApplicationConfig } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { routes } from './app.routes';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { errorInterceptor } from './core/interceptors/error.interceptor';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideClientHydration } from '@angular/platform-browser';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes, withComponentInputBinding()),
    // A ordem do array é a ordem de execução da requisição. Na volta o erro sobe na
    // ordem inversa, então o errorInterceptor traduz a mensagem antes de o
    // authInterceptor ver o 401 — por isso ele devolve a mesma instância de
    // HttpErrorResponse, e não uma cópia.
    provideHttpClient(withInterceptors([authInterceptor, errorInterceptor])),
    provideAnimations(),
    // A landing é pré-renderizada no build; a hidratação faz o Angular reaproveitar esse HTML
    // em vez de descartá-lo e desenhar tudo de novo, que é o que dava o salto de layout.
    provideClientHydration()
  ]
};
