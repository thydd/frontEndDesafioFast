import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';

import { environment } from '../../environments/environment';
import { ApiSuccessResponse } from '../models/api-response.model';
import { Colaborador } from '../models/colaborador.model';

@Injectable({ providedIn: 'root' })
export class ColaboradoresService {
  private readonly apiUrl = `${environment.apiBaseUrl}/api/colaboradores`;

  constructor(private readonly http: HttpClient) {}

  getAll(): Observable<Colaborador[]> {
    return this.http
      .get<ApiSuccessResponse<Colaborador[]> | null>(this.apiUrl)
      .pipe(map((response) => response?.data ?? []));
  }
}
