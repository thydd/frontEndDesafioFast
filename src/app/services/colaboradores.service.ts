import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';

import { environment } from '../../environments/environment';
import { ApiSuccessResponse } from '../models/api-response.model';
import { Colaborador } from '../models/colaborador.model';

export interface ColaboradorPayload {
  nome: string;
}

@Injectable({ providedIn: 'root' })
export class ColaboradoresService {
  private readonly apiUrl = `${environment.apiBaseUrl}/api/colaboradores`;

  constructor(private readonly http: HttpClient) {}

  getAll(): Observable<Colaborador[]> {
    return this.http
      .get<ApiSuccessResponse<Colaborador[]> | null>(this.apiUrl)
      .pipe(map((response) => response?.data ?? []));
  }

  create(payload: ColaboradorPayload): Observable<void> {
    return this.http
      .post<ApiSuccessResponse<Colaborador> | null>(this.apiUrl, payload)
      .pipe(map(() => undefined));
  }

  update(id: number, payload: ColaboradorPayload): Observable<void> {
    return this.http
      .put<ApiSuccessResponse<Colaborador> | null>(`${this.apiUrl}/${id}`, payload)
      .pipe(map(() => undefined));
  }

  delete(id: number): Observable<void> {
    return this.http
      .delete<ApiSuccessResponse<unknown> | null>(`${this.apiUrl}/${id}`)
      .pipe(map(() => undefined));
  }
}
