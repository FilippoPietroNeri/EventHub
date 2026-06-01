import { Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { EventService } from '../../core/event.service';
import { Event } from '../../core/models';
import { EventCardComponent } from '../../shared/event-card/event-card.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [EventCardComponent, MatProgressSpinnerModule, RouterLink, MatButtonModule],
  template: `
    <section class="hero glass-panel">
      <span class="badge">Piattaforma eventi</span>
      <h1>Vivi gli eventi della tua città</h1>
      <p>
        EventHub ti aiuta a scoprire concerti, workshop e presentazioni, acquistare
        biglietti e gestire registrazioni in un unico posto.
      </p>
      <div class="actions">
        <a mat-raised-button color="primary" routerLink="/events">Esplora eventi</a>
        <a mat-stroked-button routerLink="/auth/register">Diventa organizer</a>
      </div>

      <div class="stats">
        <article>
          <strong>{{ featured.length }}</strong>
          <span>In evidenza</span>
        </article>
        <article>
          <strong>{{ upcoming.length }}</strong>
          <span>In arrivo</span>
        </article>
      </div>
    </section>

    @if (loading) {
      <div class="loading-wrap">
        <mat-spinner />
      </div>
    } @else {
      <h2>In evidenza questa settimana</h2>
      <div class="grid">
        @for (e of featured; track e.id) {
          <app-event-card [event]="e" />
        }
      </div>

      <h2>Prossimi in programma</h2>
      <div class="grid">
        @for (e of upcoming; track e.id) {
          <app-event-card [event]="e" />
        }
      </div>
    }
  `,
  styles: `
    .hero {
      margin-bottom: 2rem;
      padding: 2rem;
      text-align: center;
      position: relative;
      overflow: hidden;
    }
    .hero::after {
      content: '';
      position: absolute;
      inset: auto -80px -80px auto;
      width: 220px;
      height: 220px;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(79, 70, 229, 0.2), transparent 70%);
      pointer-events: none;
    }
    .badge {
      display: inline-block;
      padding: 0.35rem 0.7rem;
      border-radius: 999px;
      font-size: 0.75rem;
      font-weight: 600;
      color: #3730a3;
      background: #e0e7ff;
    }
    .hero h1 {
      font-size: clamp(2rem, 4vw, 3rem);
      margin: 0.75rem 0 0.5rem;
    }
    .hero p {
      max-width: 720px;
      margin: 0 auto;
      color: #334155;
      line-height: 1.5;
    }
    .actions {
      margin-top: 1.25rem;
      display: flex;
      justify-content: center;
      gap: 0.75rem;
      flex-wrap: wrap;
    }
    .stats {
      margin-top: 1.5rem;
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 140px));
      justify-content: center;
      gap: 0.75rem;
    }
    .stats article {
      background: #ffffff;
      border-radius: 0.85rem;
      border: 1px solid #e2e8f0;
      padding: 0.75rem;
      display: flex;
      flex-direction: column;
      gap: 0.2rem;
    }
    .stats strong { font-size: 1.2rem; }
    .stats span { font-size: 0.8rem; color: #64748b; }
    .loading-wrap {
      display: flex;
      justify-content: center;
      margin: 2rem 0;
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 1.25rem;
      margin-bottom: 2rem;
    }
    h2 { margin: 1.5rem 0 1rem; font-size: 1.5rem; }
  `,
})
export class HomeComponent implements OnInit {
  private readonly events = inject(EventService);
  featured: Event[] = [];
  upcoming: Event[] = [];
  loading = true;

  ngOnInit(): void {
    this.events.home().subscribe({
      next: (res) => {
        this.featured = res.featured;
        this.upcoming = res.upcoming;
        this.loading = false;
      },
      error: () => (this.loading = false),
    });
  }
}
