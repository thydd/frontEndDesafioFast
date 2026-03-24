import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';

import { environment } from '../../environments/environment';
import { ApiSuccessResponse } from '../models/api-response.model';
import { Workshop } from '../models/workshop.model';

@Injectable({ providedIn: 'root' })
export class WorkshopsService {
  private readonly apiUrl = `${environment.apiBaseUrl}/api/workshops`;

  constructor(private readonly http: HttpClient) {}

  getAll(): Observable<Workshop[]> {
    return this.http
      .get<ApiSuccessResponse<Workshop[]> | null>(this.apiUrl)
      .pipe(map((response) => response?.data ?? []));
  }
}
