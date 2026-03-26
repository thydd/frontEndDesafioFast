import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, signal } from '@angular/core';
import { Observable, catchError, tap, throwError } from 'rxjs';

import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ApiUrlService {
  private readonly configuredBaseUrls = environment.apiBaseUrls?.length
    ? environment.apiBaseUrls
    : [environment.apiBaseUrl];

  private readonly preferredBaseUrl = signal<string>(this.configuredBaseUrls[0]);

  request<T>(operation: (baseUrl: string) => Observable<T>): Observable<T> {
    const prioritizedBaseUrls = this.getPrioritizedBaseUrls();
    return this.tryRequest(prioritizedBaseUrls, 0, operation);
  }

  private getPrioritizedBaseUrls(): string[] {
    const preferred = this.preferredBaseUrl();
    const ordered = [preferred, ...this.configuredBaseUrls.filter((url) => url !== preferred)];
    return [...new Set(ordered)];
  }

  private tryRequest<T>(
    baseUrls: string[],
    index: number,
    operation: (baseUrl: string) => Observable<T>
  ): Observable<T> {
    const baseUrl = baseUrls[index];

    return operation(baseUrl).pipe(
      tap(() => this.preferredBaseUrl.set(baseUrl)),
      catchError((error: unknown) => {
        const isNetworkError = error instanceof HttpErrorResponse && error.status === 0;
        const hasFallback = index < baseUrls.length - 1;

        if (isNetworkError && hasFallback) {
          return this.tryRequest(baseUrls, index + 1, operation);
        }

        return throwError(() => error);
      })
    );
  }
}
