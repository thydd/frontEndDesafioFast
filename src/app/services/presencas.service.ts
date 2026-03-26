import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';

import { ApiSuccessResponse } from '../models/api-response.model';
import { Presenca } from '../models/presenca.model';
import { ApiUrlService } from './api-url.service';

export interface PresencaPayload {
  workshopId: number;
  colaboradorId: number;
  dataHoraCheckIn: string;
}

@Injectable({ providedIn: 'root' })
export class PresencasService {
  constructor(
    private readonly http: HttpClient,
    private readonly apiUrlService: ApiUrlService
  ) {}

  getAll(): Observable<Presenca[]> {
    return this.apiUrlService
      .request((baseUrl) =>
        this.http.get<ApiSuccessResponse<Presenca[]> | null>(`${baseUrl}/api/presencas`)
      )
      .pipe(map((response) => response?.data ?? []));
  }

  create(payload: PresencaPayload): Observable<void> {
    return this.apiUrlService
      .request((baseUrl) =>
        this.http.post<ApiSuccessResponse<Presenca> | null>(`${baseUrl}/api/presencas`, payload)
      )
      .pipe(map(() => undefined));
  }

  update(workshopId: number, colaboradorId: number, payload: PresencaPayload): Observable<void> {
    return this.apiUrlService
      .request((baseUrl) =>
        this.http.put<ApiSuccessResponse<Presenca> | null>(
          `${baseUrl}/api/presencas/${workshopId}/${colaboradorId}`,
          payload
        )
      )
      .pipe(map(() => undefined));
  }

  delete(workshopId: number, colaboradorId: number): Observable<void> {
    return this.apiUrlService
      .request((baseUrl) =>
        this.http.delete<ApiSuccessResponse<unknown> | null>(
          `${baseUrl}/api/presencas/${workshopId}/${colaboradorId}`
        )
      )
      .pipe(map(() => undefined));
  }
}
