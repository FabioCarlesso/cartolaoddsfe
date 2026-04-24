import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CacheResponse } from '../../../shared/models/configuracao.model';

@Injectable({ providedIn: 'root' })
export class CacheService {
  private http = inject(HttpClient);
  private readonly baseUrl = '/api/cache';

  invalidateAll(): Observable<CacheResponse> {
    return this.http.delete<CacheResponse>(this.baseUrl);
  }

  invalidateByName(nome: string): Observable<CacheResponse> {
    return this.http.delete<CacheResponse>(`${this.baseUrl}/${nome}`);
  }
}
