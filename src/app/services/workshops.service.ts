import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';

import { ApiSuccessResponse } from '../models/api-response.model';
import { Workshop } from '../models/workshop.model';
import { ApiUrlService } from './api-url.service';

export interface WorkshopPayload {
  nome: string;
  descricao?: string;
  data?: string;
  dataHora?: string;
}

@Injectable({ providedIn: 'root' })
export class WorkshopsService {
  constructor(
    private readonly http: HttpClient,
    private readonly apiUrlService: ApiUrlService
  ) {}

  getAll(): Observable<Workshop[]> {
    return this.apiUrlService
      .request((baseUrl) =>
        this.http.get<ApiSuccessResponse<Workshop[]> | null>(`${baseUrl}/api/workshops`)
      )
      .pipe(map((response) => response?.data ?? []));
  }

  create(payload: WorkshopPayload): Observable<void> {
    return this.apiUrlService
      .request((baseUrl) =>
        this.http.post<ApiSuccessResponse<Workshop> | null>(`${baseUrl}/api/workshops`, payload)
      )
      .pipe(map(() => undefined));
  }

  update(id: number, payload: WorkshopPayload): Observable<void> {
    return this.apiUrlService
      .request((baseUrl) =>
        this.http.put<ApiSuccessResponse<Workshop> | null>(`${baseUrl}/api/workshops/${id}`, payload)
      )
      .pipe(map(() => undefined));
  }

  delete(id: number): Observable<void> {
    return this.apiUrlService
      .request((baseUrl) =>
        this.http.delete<ApiSuccessResponse<unknown> | null>(`${baseUrl}/api/workshops/${id}`)
      )
      .pipe(map(() => undefined));
  }
}
