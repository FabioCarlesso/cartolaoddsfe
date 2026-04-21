import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      let userMessage = 'Erro desconhecido. Tente novamente.';

      if (error.status === 0) {
        userMessage =
          'Não foi possível conectar ao servidor. Verifique se o backend está rodando na porta 8080.';
      } else if (error.status === 400) {
        userMessage = error.error?.mensagem || 'Requisição inválida.';
      } else if (error.status === 422) {
        userMessage =
          error.error?.mensagem ||
          'Pool de atletas vazio. O ODD_LIMITE pode estar muito restritivo ou a API Key não está configurada.';
      } else if (error.status === 502) {
        userMessage =
          'Falha ao comunicar com uma API externa (Cartola FC ou Odds API). Tente novamente em instantes.';
      } else if (error.status >= 500) {
        userMessage = error.error?.mensagem || 'Erro interno do servidor.';
      }

      return throwError(() => ({ ...error, userMessage }));
    })
  );
};
