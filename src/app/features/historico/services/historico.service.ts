import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { HistoricoResponse, EscalacaoRodadaResponse } from '../../../shared/models/historico.model';

@Injectable({ providedIn: 'root' })
export class HistoricoService {
  private http = inject(HttpClient);
  private readonly baseUrl = '/api/historico';

  getHistorico(): Observable<HistoricoResponse> {
    return this.http.get<HistoricoResponse>(this.baseUrl);
  }

  getRodada(rodadaId: number): Observable<EscalacaoRodadaResponse> {
    return this.http.get<EscalacaoRodadaResponse>(`${this.baseUrl}/${rodadaId}`);
  }

  atualizarPontuacao(rodadaId: number): Observable<EscalacaoRodadaResponse> {
    return this.http.post<EscalacaoRodadaResponse>(`${this.baseUrl}/${rodadaId}/atualizar-pontuacao`, {});
  }
}
