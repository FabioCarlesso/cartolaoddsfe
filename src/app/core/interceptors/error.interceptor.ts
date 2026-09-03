import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const isLogin = req.url.includes('/api/auth/login');

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      let userMessage = 'Erro desconhecido. Tente novamente.';

      if (error.status === 0) {
        userMessage =
          'Não foi possível conectar ao servidor. Verifique se o backend está rodando na porta 8080.';
      } else if (error.status === 400) {
        userMessage = error.error?.mensagem || 'Requisição inválida.';
      } else if (error.status === 401) {
        // No login o 401 é credencial errada; em qualquer outra chamada é a sessão que
        // acabou — o authInterceptor já cuidou de limpar o token e redirecionar.
        userMessage = isLogin
          ? 'E-mail ou senha inválidos.'
          : 'Sessão expirada. Entre novamente.';
      } else if (error.status === 403) {
        userMessage = 'Você não tem permissão para esta ação.';
      } else if (error.status === 409) {
        // Conflitos de regra (e-mail repetido, último administrador ativo) sempre chegam
        // com uma mensagem que explica exatamente o que foi impedido.
        userMessage = error.error?.mensagem || 'A operação conflita com o estado atual.';
      } else if (error.status === 422) {
        userMessage =
          error.error?.mensagem ||
          'Pool de atletas vazio. O ODD_LIMITE pode estar muito restritivo ou a API Key não está configurada.';
      } else if (error.status === 429) {
        // Freio de força bruta do backend, que já manda quanto falta para liberar.
        userMessage = error.error?.mensagem || 'Muitas tentativas seguidas. Aguarde e tente novamente.';
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
