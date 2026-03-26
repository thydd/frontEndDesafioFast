import { HttpClient } from '@angular/common/http';
import { Injectable, signal } from '@angular/core';
import { Observable, map, tap } from 'rxjs';

import { ApiSuccessResponse } from '../models/api-response.model';
import { AuthSession, LoginData, LoginRequest } from '../models/auth.model';
import { ApiUrlService } from './api-url.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly tokenStorageKey = 'desafiofast_token';
  private readonly userStorageKey = 'desafiofast_user';
  private readonly roleStorageKey = 'desafiofast_role';

  readonly session = signal<AuthSession | null>(this.readSessionFromStorage());

  constructor(
    private readonly http: HttpClient,
    private readonly apiUrlService: ApiUrlService
  ) {}

  login(request: LoginRequest): Observable<void> {
    return this.apiUrlService
      .request((baseUrl) =>
        this.http.post<ApiSuccessResponse<LoginData>>(`${baseUrl}/api/auth/login`, request)
      )
      .pipe(
        map((response) => response.data),
        tap((loginData) => {
          const session: AuthSession = {
            accessToken: loginData.accessToken,
            username: loginData.username,
            role: loginData.role
          };

          this.persistSession(session);
          this.session.set(session);
        }),
        map(() => undefined)
      );
  }

  logout(): void {
    localStorage.removeItem(this.tokenStorageKey);
    localStorage.removeItem(this.userStorageKey);
    localStorage.removeItem(this.roleStorageKey);
    this.session.set(null);
  }

  isLoggedIn(): boolean {
    return !!this.session()?.accessToken;
  }

  getToken(): string | null {
    return this.session()?.accessToken ?? null;
  }

  isAdmin(): boolean {
    return this.session()?.role === 'Admin';
  }

  private persistSession(session: AuthSession): void {
    localStorage.setItem(this.tokenStorageKey, session.accessToken);
    localStorage.setItem(this.userStorageKey, session.username);
    localStorage.setItem(this.roleStorageKey, session.role);
  }

  private readSessionFromStorage(): AuthSession | null {
    const token = localStorage.getItem(this.tokenStorageKey);
    const username = localStorage.getItem(this.userStorageKey);
    const role = localStorage.getItem(this.roleStorageKey);

    if (!token || !username || !role) {
      return null;
    }

    return {
      accessToken: token,
      username,
      role
    };
  }
}
