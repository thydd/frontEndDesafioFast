import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';

import { environment } from '../../environments/environment';
import { ApiSuccessResponse } from '../models/api-response.model';
import { Presenca } from '../models/presenca.model';

@Injectable({ providedIn: 'root' })
export class PresencasService {
  private readonly apiUrl = `${environment.apiBaseUrl}/api/presencas`;

  constructor(private readonly http: HttpClient) {}

  getAll(): Observable<Presenca[]> {
    return this.http
      .get<ApiSuccessResponse<Presenca[]> | null>(this.apiUrl)
      .pipe(map((response) => response?.data ?? []));
  }
}
