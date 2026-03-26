import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';

import { ApiSuccessResponse } from '../models/api-response.model';
import { Colaborador } from '../models/colaborador.model';
import { ApiUrlService } from './api-url.service';

export interface ColaboradorPayload {
  nome: string;
}

@Injectable({ providedIn: 'root' })
export class ColaboradoresService {
  constructor(
    private readonly http: HttpClient,
    private readonly apiUrlService: ApiUrlService
  ) {}

  getAll(): Observable<Colaborador[]> {
    return this.apiUrlService
      .request((baseUrl) =>
        this.http.get<ApiSuccessResponse<Colaborador[]> | null>(`${baseUrl}/api/colaboradores`)
      )
      .pipe(map((response) => response?.data ?? []));
  }

  create(payload: ColaboradorPayload): Observable<void> {
    return this.apiUrlService
      .request((baseUrl) =>
        this.http.post<ApiSuccessResponse<Colaborador> | null>(`${baseUrl}/api/colaboradores`, payload)
      )
      .pipe(map(() => undefined));
  }

  update(id: number, payload: ColaboradorPayload): Observable<void> {
    return this.apiUrlService
      .request((baseUrl) =>
        this.http.put<ApiSuccessResponse<Colaborador> | null>(`${baseUrl}/api/colaboradores/${id}`, payload)
      )
      .pipe(map(() => undefined));
  }

  delete(id: number): Observable<void> {
    return this.apiUrlService
      .request((baseUrl) =>
        this.http.delete<ApiSuccessResponse<unknown> | null>(`${baseUrl}/api/colaboradores/${id}`)
      )
      .pipe(map(() => undefined));
  }
}
