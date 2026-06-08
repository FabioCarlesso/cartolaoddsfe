import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Atleta } from '../../../shared/models/atleta.model';
import { TimeResponse } from '../../../shared/models/time.model';

@Injectable({ providedIn: 'root' })
export class TimeService {
  private http = inject(HttpClient);
  private readonly baseUrl = '/api';

  getTime(orcamento?: number | null): Observable<TimeResponse> {
    let params = new HttpParams();
    if (orcamento != null) {
      params = params.set('orcamento', orcamento);
    }
    return this.http.get<any>(`${this.baseUrl}/time`, { params }).pipe(
      map(raw => this.mapTimeResponse(raw))
    );
  }

  private mapAtleta(raw: any): Atleta {
    return {
      apelido: raw.apelido,
      posicao: raw.posicao,
      clube: raw.nomeClube ?? raw.clube,
      mediaPontos: raw.mediaPontos,
      valorizacao: raw.valorizacao,
      preco: raw.preco,
      score: raw.score,
      criterioScore: raw.criterioScore ?? raw.scoreCriterio ?? raw.tipoScore ?? raw.estrategiaScore,
      descricaoScore: raw.descricaoScore ?? raw.scoreDescricao,
      pesosScore: raw.pesosScore,
      desvioPadrao: raw.desvioPadrao,
      rodadasConsideradas: raw.rodadasConsideradas,
      emDuvida: typeof raw.emDuvida === 'boolean' ? raw.emDuvida : (raw.status?.includes('Dúvida') ?? false),
      status: raw.status,
      substitutoProvavel: raw.substitutoProvavel ? this.mapAtleta(raw.substitutoProvavel) : undefined,
    };
  }

  private mapTimeResponse(raw: any): TimeResponse {
    const titulares: Atleta[] = Object.values(raw.titulares as Record<string, any[]>)
      .flat()
      .map(a => this.mapAtleta(a));

    const reservas: Atleta[] = Object.values(raw.reservas as Record<string, any>)
      .map(a => this.mapAtleta(a));

    return {
      titulares,
      reservas,
      capitao: raw.capitao ? this.mapAtleta(raw.capitao) : null,
      reservaLuxo: raw.reservaLuxo ? this.mapAtleta(raw.reservaLuxo) : null,
      alertasDuvida: raw.alertasDuvida ?? [],
      avisoMercado: raw.avisoMercado ?? null,
      rodada: raw.rodada,
      custoTotal: raw.custoTotal ?? 0,
      orcamentoInformado: raw.orcamentoInformado ?? null,
      saldoRestante: raw.saldoRestante ?? null,
      estrategia: raw.estrategia ?? 'SCORE_MAXIMO',
      formacaoCompleta: raw.formacaoCompleta ?? true,
      avisoOrcamento: raw.avisoOrcamento ?? null,
    };
  }
}
