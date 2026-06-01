import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AsyncPipe } from '@angular/common';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    AsyncPipe,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
  ],
  template: `
    <mat-toolbar class="toolbar glass-panel">
      <div class="brand-block">
        <a routerLink="/" class="brand">
          <span class="brand-dot">EH</span>
          <span>
            <strong>EventHub</strong>
            <small>Discover live culture</small>
          </span>
        </a>
        <span class="brand-chip">Curated by city</span>
      </div>

      <nav class="nav-links" aria-label="Primary">
        <a mat-button routerLink="/events" routerLinkActive="active">Eventi</a>
        <a mat-button routerLink="/auth/register" routerLinkActive="active">Organizza</a>
      </nav>

      <span class="spacer"></span>

      @if (auth.user$ | async; as user) {
        <div class="session-links">
          <a mat-button routerLink="/account/tickets">Biglietti</a>
          @if (user.role === 'organizer' || user.role === 'admin') {
            <a mat-button routerLink="/organizer">Dashboard</a>
            <a mat-button routerLink="/organizer/events">Gestione</a>
          }
          @if (user.role === 'admin') {
            <a mat-button routerLink="/admin">Admin</a>
          }
        </div>
        @if (user.role === 'organizer' || user.role === 'admin') {
          <span class="status-pill">Live organizer</span>
        }
        <button mat-stroked-button [matMenuTriggerFor]="menu">{{ user.full_name }}</button>
        <mat-menu #menu="matMenu">
          <a mat-menu-item routerLink="/account/profile">Profilo</a>
          <button mat-menu-item (click)="onLogout()">Esci</button>
        </mat-menu>
      } @else {
        <div class="session-links guest">
          <a mat-button routerLink="/auth/login">Accedi</a>
          <a mat-raised-button color="primary" routerLink="/auth/register">Inizia ora</a>
        </div>
      }
    </mat-toolbar>
    <main class="main">
      <router-outlet />
    </main>
    <footer class="footer">
      <div>© EventHub — Gestione eventi culturali</div>
      <small>Scopri, organizza, partecipa.</small>
    </footer>
  `,
  styles: `
    .toolbar {
      position: sticky;
      top: 0.85rem;
      z-index: 100;
      margin: 0.85rem auto 0;
      width: min(1280px, calc(100% - 1.2rem));
      border-radius: 1.35rem;
      padding: 0.7rem 0.9rem;
      background: rgba(255, 255, 255, 0.82);
      color: #0f172a;
      display: flex;
      gap: 0.8rem;
      align-items: center;
      box-shadow: 0 18px 40px rgba(15, 23, 42, 0.12);
    }
    .brand-block {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      min-width: 0;
    }
    .brand {
      color: #0f172a;
      text-decoration: none;
      font-weight: 700;
      font-size: 1.02rem;
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      line-height: 1.1;
    }
    .brand span {
      display: flex;
      flex-direction: column;
      gap: 0.1rem;
    }
    .brand small {
      color: var(--muted);
      font-size: 0.72rem;
      font-weight: 600;
      letter-spacing: 0.04em;
      text-transform: uppercase;
    }
    .brand-dot {
      width: 2.15rem;
      height: 2.15rem;
      border-radius: 999px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: 0.76rem;
      font-weight: 700;
      background: linear-gradient(135deg, #0f766e, #0ea5e9);
      color: #fff;
      box-shadow: 0 10px 20px rgba(15, 118, 110, 0.28);
      flex-shrink: 0;
    }
    .brand-chip,
    .status-pill {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 0.38rem 0.7rem;
      border-radius: 999px;
      font-size: 0.72rem;
      font-weight: 700;
      letter-spacing: 0.04em;
      text-transform: uppercase;
      white-space: nowrap;
    }
    .brand-chip {
      color: #0f766e;
      background: rgba(15, 118, 110, 0.1);
    }
    .status-pill {
      color: #b45309;
      background: rgba(249, 115, 22, 0.12);
    }
    .spacer { flex: 1; }
    .nav-links,
    .session-links {
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
      flex-wrap: wrap;
    }
    .guest {
      gap: 0.5rem;
    }
    .main { max-width: 1280px; margin: 0 auto; padding: 1.9rem 1rem 3.5rem; min-height: 70vh; }
    .footer {
      text-align: center;
      padding: 1.4rem 1rem 1.9rem;
      color: var(--muted);
      font-size: 0.85rem;
      border-top: 1px solid rgba(148, 163, 184, 0.22);
      background: rgba(255, 255, 255, 0.52);
      backdrop-filter: blur(10px);
    }
    .active { font-weight: 800; color: #0f766e; }
  `,
})
export class ShellComponent {
  readonly auth = inject(AuthService);

  onLogout(): void {
    void this.auth.logout();
  }
}
