import { Perfil } from './auth.model';

/** Usuário como a API o devolve (`UsuarioResponse`). Nunca traz senha, nem em hash. */
export interface Usuario {
  id: number;
  nome: string;
  email: string;
  perfil: Perfil;
  ativo: boolean;
  criadoEm: string;
}

/** Corpo de `POST /api/usuarios`. */
export interface UsuarioRequest {
  nome: string;
  email: string;
  senha: string;
  perfil: Perfil;
}

/** Corpo de `PATCH /api/usuarios/{id}` — todos os campos são opcionais. */
export interface UsuarioUpdateRequest {
  nome?: string;
  email?: string;
  perfil?: Perfil;
  ativo?: boolean;
}

/** Envelope de paginação da API (`PaginaResponse`). */
export interface Pagina<T> {
  conteudo: T[];
  pagina: number;
  tamanho: number;
  totalElementos: number;
  totalPaginas: number;
  ultima: boolean;
}
