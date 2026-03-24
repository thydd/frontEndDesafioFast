import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, RouterOutlet],
  template: `
    <div class="app-shell">
      <header class="topbar">
        <a class="brand" routerLink="/workshops">
          <span class="brand-mark"></span>
          <div>
            <strong>Desafio Fast</strong>
            <p>Frontend Angular + API .NET 10</p>
          </div>
        </a>

        <nav *ngIf="authService.session() as session; else guestMenu">
          <a routerLink="/workshops" routerLinkActive="active">Workshops</a>
          <a routerLink="/colaboradores" routerLinkActive="active">Colaboradores</a>
          <span class="badge">{{ session.username }} ({{ session.role }})</span>
          <button type="button" (click)="logout()">Sair</button>
        </nav>

        <ng-template #guestMenu>
          <nav>
            <a routerLink="/login" routerLinkActive="active">Login</a>
          </nav>
        </ng-template>
      </header>

      <main class="content">
        <router-outlet></router-outlet>
      </main>
    </div>
  `,
  styleUrl: './app.css'
})
export class App {
  readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  logout(): void {
    this.authService.logout();
    this.router.navigateByUrl('/login');
  }
}
