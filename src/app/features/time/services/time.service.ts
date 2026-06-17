import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { TimeResponse } from '../../../shared/models/time.model';
import { mapTimeResponse } from '../../../shared/utils/time-mapper.util';

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
      map(raw => mapTimeResponse(raw))
    );
  }
}
