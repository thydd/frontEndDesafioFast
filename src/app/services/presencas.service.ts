import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';

import { environment } from '../../environments/environment';
import { ApiSuccessResponse } from '../models/api-response.model';
import { Presenca } from '../models/presenca.model';

export interface PresencaPayload {
  workshopId: number;
  colaboradorId: number;
  dataHoraCheckIn: string;
}

@Injectable({ providedIn: 'root' })
export class PresencasService {
  private readonly apiUrl = `${environment.apiBaseUrl}/api/presencas`;

  constructor(private readonly http: HttpClient) {}

  getAll(): Observable<Presenca[]> {
    return this.http
      .get<ApiSuccessResponse<Presenca[]> | null>(this.apiUrl)
      .pipe(map((response) => response?.data ?? []));
  }

  create(payload: PresencaPayload): Observable<void> {
    return this.http
      .post<ApiSuccessResponse<Presenca> | null>(this.apiUrl, payload)
      .pipe(map(() => undefined));
  }

  update(workshopId: number, colaboradorId: number, payload: PresencaPayload): Observable<void> {
    return this.http
      .put<ApiSuccessResponse<Presenca> | null>(
        `${this.apiUrl}/${workshopId}/${colaboradorId}`,
        payload
      )
      .pipe(map(() => undefined));
  }

  delete(workshopId: number, colaboradorId: number): Observable<void> {
    return this.http
      .delete<ApiSuccessResponse<unknown> | null>(`${this.apiUrl}/${workshopId}/${colaboradorId}`)
      .pipe(map(() => undefined));
  }
}
