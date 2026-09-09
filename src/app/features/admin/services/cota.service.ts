import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CotaResponse, CotaHistoricoResponse } from '../../../shared/models/cota.model';

@Injectable({ providedIn: 'root' })
export class CotaService {
  private http = inject(HttpClient);
  private readonly baseUrl = '/api/odds/cota';

  getCota(): Observable<CotaResponse> {
    return this.http.get<CotaResponse>(this.baseUrl);
  }

  /** Série das leituras na janela. Sem `dias`, a API aplica o padrão de 30 dias. */
  getHistorico(dias?: number): Observable<CotaHistoricoResponse> {
    let params = new HttpParams();
    if (dias != null) {
      params = params.set('dias', dias.toString());
    }
    return this.http.get<CotaHistoricoResponse>(`${this.baseUrl}/historico`, { params });
  }
}
