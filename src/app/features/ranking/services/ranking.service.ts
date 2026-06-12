import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { RankingResponse } from '../../../shared/models/ranking.model';

@Injectable({ providedIn: 'root' })
export class RankingService {
  private http = inject(HttpClient);
  private readonly baseUrl = '/api';

  getRanking(posicao?: string, limite = 25, excluirDuvida = false): Observable<RankingResponse> {
    let params = new HttpParams().set('limite', limite.toString());
    if (posicao) {
      params = params.set('posicao', posicao);
    }
    if (excluirDuvida) {
      params = params.set('excluirDuvida', 'true');
    }
    return this.http.get<RankingResponse>(`${this.baseUrl}/ranking`, { params });
  }
}
