import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

/** Único endpoint público da API — mandar `Authorization` nele não faz sentido. */
const LOGIN_URL = '/api/auth/login';

/**
 * Carimba o `Authorization` em toda chamada à API e reage ao fim da sessão.
 *
 * Registrado antes do `errorInterceptor` em `app.config.ts`, o que o deixa mais externo:
 * no caminho de erro o `errorInterceptor` roda primeiro e traduz a mensagem, e só depois
 * o `401` chega aqui. Os dois convivem porque o `errorInterceptor` propaga a mesma
 * instância de `HttpErrorResponse` — é ela que o `instanceof` abaixo reconhece.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const isLogin = req.url.includes(LOGIN_URL);
  const token = authService.getToken();

  if (token && !isLogin) {
    req = req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
  }

  return next(req).pipe(
    catchError((error: unknown) => {
      // Fora do login, a API só devolve 401 pelo `ErroSegurancaHandler`, e sempre pelo
      // mesmo motivo: o token não vale mais (ausente, expirado, assinatura inválida, ou
      // revogado por troca de senha ou desativação do usuário). Um 401 de outra origem
      // não existe neste backend — credencial inválida é 401 apenas no login, e senha
      // atual errada na troca de senha é 422. Já o 403 é permissão insuficiente com
      // sessão válida, e por isso não derruba ninguém.
      if (!isLogin && error instanceof HttpErrorResponse && error.status === 401 && token) {
        authService.encerrarSessaoExpirada();
      }

      return throwError(() => error);
    })
  );
};
