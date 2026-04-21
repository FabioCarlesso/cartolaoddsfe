import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { FavoritosResponse } from '../../../shared/models/favoritos.model';

@Injectable({ providedIn: 'root' })
export class FavoritosService {
  private http = inject(HttpClient);
  private readonly baseUrl = '/api';

  getFavoritos(oddLimite?: number): Observable<FavoritosResponse> {
    let params = new HttpParams();
    if (oddLimite != null) {
      params = params.set('oddLimite', oddLimite.toString());
    }
    return this.http.get<FavoritosResponse>(`${this.baseUrl}/favoritos`, { params });
  }
}
