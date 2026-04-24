import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ConfiguracaoResponse, ConfiguracaoRequest } from '../../../shared/models/configuracao.model';

@Injectable({ providedIn: 'root' })
export class ConfiguracaoService {
  private http = inject(HttpClient);
  private readonly baseUrl = '/api/config';

  getConfig(): Observable<ConfiguracaoResponse> {
    return this.http.get<ConfiguracaoResponse>(this.baseUrl);
  }

  patchConfig(request: ConfiguracaoRequest): Observable<ConfiguracaoResponse> {
    return this.http.patch<ConfiguracaoResponse>(this.baseUrl, request);
  }

  resetConfig(): Observable<ConfiguracaoResponse> {
    return this.http.post<ConfiguracaoResponse>(`${this.baseUrl}/reset`, {});
  }
}
