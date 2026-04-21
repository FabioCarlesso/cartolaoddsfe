import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { TimeResponse } from '../../../shared/models/time.model';

@Injectable({ providedIn: 'root' })
export class TimeService {
  private http = inject(HttpClient);
  private readonly baseUrl = '/api';

  getTime(): Observable<TimeResponse> {
    return this.http.get<TimeResponse>(`${this.baseUrl}/time`);
  }
}
