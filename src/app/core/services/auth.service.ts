import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import {
  AlterarSenhaRequest,
  LoginRequest,
  LoginResponse,
  Perfil,
  SessaoUsuario
} from '../models/auth.model';

const TOKEN_KEY = 'cartolaodds.accessToken';
const NOME_KEY = 'cartolaodds.nome';

/** Claims emitidos pelo `JwtService` do backend. */
interface JwtClaims {
  sub?: string;
  perfil?: string;
  usuarioId?: number;
  exp?: number;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);

  private readonly loginUrl = '/api/auth/login';
  private readonly senhaUrl = '/api/usuarios/me/senha';

  private readonly sessao = signal<SessaoUsuario | null>(null);

  /**
   * Marca que a última limpeza veio de um token que não valia mais — vencido, ilegível ou
   * sem perfil —, e não de uma saída deliberada. É o que permite à tela de login explicar
   * por que o usuário foi parar nela, mesmo quando quem descartou o token foi o guard, sem
   * nenhuma chamada à API acontecer.
   */
  private tokenDescartado = false;

  /** Sessão corrente, para os templates reagirem a login e logout. */
  readonly usuarioAtual = this.sessao.asReadonly();
  readonly autenticado = computed(() => this.sessao() !== null);
  readonly perfilAtual = computed<Perfil | null>(() => this.sessao()?.perfil ?? null);

  constructor() {
    this.restaurarSessao();
  }

  login(request: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(this.loginUrl, request).pipe(
      tap((res) => {
        gravar(TOKEN_KEY, res.accessToken);
        gravar(NOME_KEY, res.nome ?? '');
        // A sessão sai do token que acabou de chegar, e não de uma releitura do storage:
        // assim o login funciona mesmo onde a persistência não está disponível.
        this.sessao.set(montarSessao(res.accessToken, res.nome));
      })
    );
  }

  alterarSenha(request: AlterarSenhaRequest): Observable<void> {
    return this.http.patch<void>(this.senhaUrl, request);
  }

  /** Saída deliberada do usuário. */
  logout(): void {
    this.limparSessao();
    this.router.navigate(['/login']);
  }

  /**
   * Saída após a troca de senha. O backend invalida o token nessa operação, então a sessão
   * já morreu de qualquer forma; o parâmetro é o que faz a tela de login confirmar a troca
   * em vez de deixar o usuário sem saber se ela deu certo.
   */
  encerrarSessaoAposTrocaDeSenha(): void {
    this.limparSessao();
    this.router.navigate(['/login'], { queryParams: { senhaAlterada: '1' } });
  }

  /** Saída forçada por token expirado ou revogado — a tela de login avisa o motivo. */
  encerrarSessaoExpirada(): void {
    this.limparSessao();
    this.router.navigate(['/login'], { queryParams: { expirada: '1' } });
  }

  limparSessao(): void {
    remover(TOKEN_KEY);
    remover(NOME_KEY);
    this.sessao.set(null);
    this.tokenDescartado = false;
  }

  /**
   * Consome o aviso de token descartado: devolve `true` uma única vez por descarte, para o
   * banner de sessão expirada não reaparecer numa visita posterior à tela de login.
   */
  consumirTokenDescartado(): boolean {
    const descartado = this.tokenDescartado;
    this.tokenDescartado = false;
    return descartado;
  }

  getToken(): string | null {
    return ler(TOKEN_KEY);
  }

  /**
   * Só é sessão válida o token que ainda existe, decodifica, traz o claim `perfil` e não
   * expirou. A expiração é conferida a cada chamada — e não apenas no boot — porque o
   * token vence com a aba aberta, e nesse ponto a sessão já não vale mais nada.
   */
  isAuthenticated(): boolean {
    const token = this.getToken();
    if (!token) {
      this.sessao.set(null);
      return false;
    }

    const sessao = montarSessao(token, ler(NOME_KEY));
    if (!sessao) {
      this.limparSessao();
      this.tokenDescartado = true;
      return false;
    }

    this.sessao.set(sessao);
    return true;
  }

  getUsuarioAtual(): SessaoUsuario | null {
    return this.sessao();
  }

  getPerfilAtual(): Perfil | null {
    return this.sessao()?.perfil ?? null;
  }

  isAdmin(): boolean {
    return this.getPerfilAtual() === 'ADMIN';
  }

  private restaurarSessao(): void {
    const token = this.getToken();
    const sessao = token ? montarSessao(token, ler(NOME_KEY)) : null;

    if (token && !sessao) {
      // Token corrompido, sem o claim de perfil ou já vencido: não há como confiar nele.
      this.limparSessao();
      this.tokenDescartado = true;
      return;
    }

    this.sessao.set(sessao);
  }
}

/**
 * Reconstrói a sessão a partir do token. Devolve `null` para qualquer token em que não se
 * possa confiar — ilegível, sem `perfil` ou expirado.
 */
function montarSessao(token: string, nome: string | null): SessaoUsuario | null {
  const claims = lerClaims(token);
  if (!claims) {
    return null;
  }

  const perfil = claims.perfil;
  if (perfil !== 'ADMIN' && perfil !== 'USER') {
    return null;
  }

  if (typeof claims.exp !== 'number' || claims.exp * 1000 <= Date.now()) {
    return null;
  }

  const email = claims.sub ?? '';
  return {
    usuarioId: typeof claims.usuarioId === 'number' ? claims.usuarioId : null,
    email,
    nome: nome?.trim() ? nome.trim() : email,
    perfil
  };
}

/** Decodifica o payload do JWT sem validar assinatura — quem valida de verdade é a API. */
function lerClaims(token: string): JwtClaims | null {
  const payload = token.split('.')[1];
  if (!payload) {
    return null;
  }

  try {
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const bytes = Uint8Array.from(atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, '=')), (c) =>
      c.charCodeAt(0)
    );
    const json = new TextDecoder().decode(bytes);
    const claims = JSON.parse(json) as unknown;
    return claims && typeof claims === 'object' && !Array.isArray(claims) ? (claims as JwtClaims) : null;
  } catch {
    return null;
  }
}

// O acesso ao localStorage é sempre protegido: navegador em modo privado ou com storage
// de site bloqueado lança já na leitura, e isso não pode derrubar a aplicação inteira.
// Só nesse caso a sessão passa a viver em memória — o usuário navega normalmente e apenas
// perde o login ao recarregar a página, em vez de não conseguir entrar. Quando o storage
// responde, ele é a única fonte: a memória não pode sombrear um token que foi apagado.
const memoria = new Map<string, string>();

function storageDisponivel(): Storage | null {
  try {
    localStorage.getItem(TOKEN_KEY);
    return localStorage;
  } catch {
    return null;
  }
}

function ler(chave: string): string | null {
  // A memória só tem entrada quando a gravação no storage falhou, então ela nunca sombreia
  // um valor que o storage de fato guardou.
  return storageDisponivel()?.getItem(chave) ?? memoria.get(chave) ?? null;
}

function gravar(chave: string, valor: string): void {
  const storage = storageDisponivel();
  if (!storage) {
    memoria.set(chave, valor);
    return;
  }

  try {
    storage.setItem(chave, valor);
  } catch {
    // Storage legível mas sem espaço para gravar (cota estourada): a sessão vale só
    // enquanto a página estiver carregada.
    memoria.set(chave, valor);
  }
}

function remover(chave: string): void {
  memoria.delete(chave);
  try {
    localStorage.removeItem(chave);
  } catch {
    /* nada a limpar se o storage não está acessível */
  }
}
