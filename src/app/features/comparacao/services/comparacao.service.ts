import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { CompararResponse, FormacaoComparada } from '../../../shared/models/comparacao.model';
import { mapAtleta, mapTimeResponse } from '../../../shared/utils/time-mapper.util';

@Injectable({ providedIn: 'root' })
export class ComparacaoService {
  private http = inject(HttpClient);
  private readonly baseUrl = '/api';

  /**
   * Compara o melhor time entre múltiplas formações via `GET /api/time/comparar`.
   * Os resultados retornam ordenados por `scoreTotal` decrescente, com as
   * formações indisponíveis (sem atletas suficientes) ao final.
   */
  comparar(formacoes: string[], orcamento?: number | null): Observable<CompararResponse> {
    let params = new HttpParams();
    for (const f of formacoes) {
      params = params.append('formacoes', f);
    }
    if (orcamento != null) {
      params = params.set('orcamento', orcamento);
    }
    return this.http.get<any>(`${this.baseUrl}/time/comparar`, { params }).pipe(
      map((raw) => this.mapResponse(raw))
    );
  }

  private mapResponse(raw: any): CompararResponse {
    const resultados: FormacaoComparada[] = (raw?.resultados ?? []).map((r: any) =>
      this.mapResultado(r)
    );

    resultados.sort((a, b) => {
      // Formações indisponíveis vão para o final, independentemente do score.
      if (a.indisponivel !== b.indisponivel) {
        return a.indisponivel ? 1 : -1;
      }
      return b.scoreTotal - a.scoreTotal;
    });

    const melhorFormacao =
      raw?.melhorFormacao ?? resultados.find((r) => !r.indisponivel)?.formacao ?? null;

    return { melhorFormacao, resultados };
  }

  private mapResultado(r: any): FormacaoComparada {
    const semTitulares = !r?.titulares || Object.keys(r.titulares).length === 0;
    const indisponivel = r?.indisponivel === true || semTitulares;
    const aviso =
      r?.aviso ??
      r?.mensagem ??
      r?.erro ??
      (indisponivel ? 'Atletas insuficientes para esta formação.' : null);

    const time = indisponivel ? null : mapTimeResponse(r);

    return {
      formacao: r?.formacao,
      scoreTotal: r?.scoreTotal ?? 0,
      custoTotal: r?.custoTotal ?? time?.custoTotal ?? 0,
      capitao: r?.capitao ? mapAtleta(r.capitao) : (time?.capitao ?? null),
      time,
      indisponivel,
      aviso,
    };
  }
}
