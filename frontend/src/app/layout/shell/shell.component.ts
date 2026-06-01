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
      <a routerLink="/" class="brand">
        <span class="brand-dot">EH</span>
        EventHub
      </a>
      <span class="spacer"></span>
      <a mat-button routerLink="/events" routerLinkActive="active">Scopri eventi</a>
      @if (auth.user$ | async; as user) {
        <a mat-button routerLink="/account/tickets">Biglietti</a>
        @if (user.role === 'organizer' || user.role === 'admin') {
          <a mat-button routerLink="/organizer">Organizer</a>
          <a mat-button routerLink="/organizer/events">Gestisci eventi</a>
        }
        @if (user.role === 'admin') {
          <a mat-button routerLink="/admin">Admin</a>
        }
        <button mat-button [matMenuTriggerFor]="menu">{{ user.full_name }}</button>
        <mat-menu #menu="matMenu">
          <a mat-menu-item routerLink="/account/profile">Profilo</a>
          <button mat-menu-item (click)="onLogout()">Esci</button>
        </mat-menu>
      } @else {
        <a mat-button routerLink="/auth/login">Accedi</a>
        <a mat-raised-button color="primary" routerLink="/auth/register">Inizia ora</a>
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
      top: 0.75rem;
      z-index: 100;
      margin: 0.75rem auto 0;
      width: min(1200px, calc(100% - 1.5rem));
      border-radius: 1rem;
      padding-inline: 0.75rem;
      background: rgba(15, 23, 42, 0.8);
      color: #e2e8f0;
    }
    .brand {
      color: #fff;
      text-decoration: none;
      font-weight: 700;
      font-size: 1.1rem;
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
    }
    .brand-dot {
      width: 2rem;
      height: 2rem;
      border-radius: 999px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: 0.75rem;
      font-weight: 700;
      background: linear-gradient(135deg, #4f46e5, #06b6d4);
      color: #fff;
    }
    .spacer { flex: 1; }
    .main { max-width: 1200px; margin: 0 auto; padding: 1.75rem 1rem 3rem; min-height: 70vh; }
    .footer {
      text-align: center;
      padding: 1.25rem 1rem 1.75rem;
      color: #64748b;
      font-size: 0.85rem;
      border-top: 1px solid #e2e8f0;
      background: rgba(255, 255, 255, 0.4);
    }
    .active { font-weight: 700; color: #fff; }
  `,
})
export class ShellComponent {
  readonly auth = inject(AuthService);

  onLogout(): void {
    void this.auth.logout();
  }
}
