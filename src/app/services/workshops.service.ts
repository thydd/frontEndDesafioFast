import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';

import { environment } from '../../environments/environment';
import { ApiSuccessResponse } from '../models/api-response.model';
import { Workshop } from '../models/workshop.model';

export interface WorkshopPayload {
  nome: string;
  descricao?: string;
  data?: string;
  dataHora?: string;
}

@Injectable({ providedIn: 'root' })
export class WorkshopsService {
  private readonly apiUrl = `${environment.apiBaseUrl}/api/workshops`;

  constructor(private readonly http: HttpClient) {}

  getAll(): Observable<Workshop[]> {
    return this.http
      .get<ApiSuccessResponse<Workshop[]> | null>(this.apiUrl)
      .pipe(map((response) => response?.data ?? []));
  }

  create(payload: WorkshopPayload): Observable<void> {
    return this.http
      .post<ApiSuccessResponse<Workshop> | null>(this.apiUrl, payload)
      .pipe(map(() => undefined));
  }

  update(id: number, payload: WorkshopPayload): Observable<void> {
    return this.http
      .put<ApiSuccessResponse<Workshop> | null>(`${this.apiUrl}/${id}`, payload)
      .pipe(map(() => undefined));
  }

  delete(id: number): Observable<void> {
    return this.http
      .delete<ApiSuccessResponse<unknown> | null>(`${this.apiUrl}/${id}`)
      .pipe(map(() => undefined));
  }
}
