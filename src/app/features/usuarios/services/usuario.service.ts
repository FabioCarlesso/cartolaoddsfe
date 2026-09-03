import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  Pagina,
  Usuario,
  UsuarioRequest,
  UsuarioUpdateRequest
} from '../../../core/models/usuario.model';

/**
 * Tamanho de página pedido na listagem.
 *
 * A API pagina em 20 por padrão, mas esta é uma aplicação pessoal com um punhado de
 * acessos: pedir tudo de uma vez evita construir uma paginação que nunca teria segunda
 * página. O total devolvido no envelope continua sendo exibido, então um dia em que a
 * lista passar disso a tela mostra a diferença.
 */
const TAMANHO_PAGINA = 100;

@Injectable({ providedIn: 'root' })
export class UsuarioService {
  private http = inject(HttpClient);
  private readonly baseUrl = '/api/usuarios';

  listar(): Observable<Pagina<Usuario>> {
    const params = new HttpParams().set('size', TAMANHO_PAGINA).set('sort', 'nome');
    return this.http.get<Pagina<Usuario>>(this.baseUrl, { params });
  }

  buscarPorId(id: number): Observable<Usuario> {
    return this.http.get<Usuario>(`${this.baseUrl}/${id}`);
  }

  criar(request: UsuarioRequest): Observable<Usuario> {
    return this.http.post<Usuario>(this.baseUrl, request);
  }

  atualizar(id: number, request: UsuarioUpdateRequest): Observable<Usuario> {
    return this.http.patch<Usuario>(`${this.baseUrl}/${id}`, request);
  }

  /** `DELETE` desativa o usuário; o cadastro permanece, apenas sem poder autenticar. */
  desativar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  ativar(id: number): Observable<Usuario> {
    return this.atualizar(id, { ativo: true });
  }
}
