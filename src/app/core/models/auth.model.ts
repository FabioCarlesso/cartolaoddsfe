/** Perfis de acesso da API (`com.cartola.odds.model.enums.Perfil`). */
export type Perfil = 'ADMIN' | 'USER';

/** Corpo de `POST /api/auth/login`. */
export interface LoginRequest {
  email: string;
  senha: string;
}

/** Resposta de `POST /api/auth/login`. */
export interface LoginResponse {
  accessToken: string;
  tipo: string;
  /** Tempo de vida do token em segundos, contado a partir da resposta. */
  expiraEmSegundos: number;
  nome: string;
  perfil: Perfil;
}

/** Corpo de `PATCH /api/usuarios/me/senha`. */
export interface AlterarSenhaRequest {
  senhaAtual: string;
  novaSenha: string;
}

/**
 * Sessão do usuário como o app a enxerga.
 *
 * `usuarioId`, `email` e `perfil` vêm dos claims do próprio token — é o token que manda,
 * não o que foi guardado ao lado dele. Só o `nome` é informação de exibição vinda do
 * corpo do login, porque o JWT não o carrega.
 */
export interface SessaoUsuario {
  usuarioId: number | null;
  email: string;
  nome: string;
  perfil: Perfil;
}
