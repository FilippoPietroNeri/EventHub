import { Component, OnInit, inject } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { EventService } from '../../core/event.service';
import { Event } from '../../core/models';
import { EventCardComponent } from '../../shared/event-card/event-card.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [EventCardComponent, MatProgressSpinnerModule, RouterLink, MatButtonModule, CurrencyPipe],
  template: `
    <section class="hero glass-panel">
      <div class="hero-copy">
        <span class="eyebrow">Event discovery platform</span>
        <h1 class="page-heading">The city, on stage.</h1>
        <p>
          EventHub trasforma concerti, workshop e cultura locale in una vetrina elegante,
          pronta per essere esplorata, prenotata e gestita senza attrito.
        </p>
        <div class="actions">
          <a mat-raised-button color="primary" routerLink="/events">Esplora eventi</a>
          <a mat-stroked-button routerLink="/auth/register">Diventa organizer</a>
        </div>

        <div class="stats">
          <article>
            <strong>{{ featured.length }}</strong>
            <span>Selezionati</span>
          </article>
          <article>
            <strong>{{ upcoming.length }}</strong>
            <span>In arrivo</span>
          </article>
          <article>
            <strong>Live</strong>
            <span>Ticket + QR</span>
          </article>
        </div>
      </div>

      <aside class="hero-side glass-panel">
        <span class="eyebrow">Curated today</span>
        <h2>{{ spotlight?.title || 'Selezione editoriale' }}</h2>
        <p class="muted">
          {{ spotlight ? spotlight.city + ' · ' + spotlight.venue : 'Città, venue e momenti selezionati per te.' }}
        </p>

        <div class="spotlight-metrics">
          <article>
            <span>Spotlight</span>
            <strong>{{ spotlight ? (spotlight.price | currency: 'EUR') : 'EUR 0' }}</strong>
          </article>
          <article>
            <span>Capienza</span>
            <strong>{{ spotlight?.capacity || '—' }}</strong>
          </article>
          <article>
            <span>Posti liberi</span>
            <strong>{{ spotlight?.spots_left || '—' }}</strong>
          </article>
        </div>

        <div class="mini-track">
          <div>
            <span>Handpicked</span>
            <strong>Concerti e cultura</strong>
          </div>
          <div>
            <span>Fast flow</span>
            <strong>Checkout + QR ticket</strong>
          </div>
        </div>
      </aside>
    </section>

    @if (loading) {
      <div class="loading-wrap">
        <mat-spinner />
      </div>
    } @else {
      <div class="section-title">
        <div>
          <h2>In evidenza questa settimana</h2>
          <p>Gli highlight scelti per far risaltare il meglio del palinsesto.</p>
        </div>
      </div>
      <div class="grid">
        @for (e of featured; track e.id) {
          <app-event-card [event]="e" />
        }
      </div>

      <div class="section-title">
        <div>
          <h2>Prossimi in programma</h2>
          <p>Una pipeline ordinata di appuntamenti da scoprire subito.</p>
        </div>
      </div>
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
      padding: 1.6rem;
      display: grid;
      grid-template-columns: 1.15fr 0.85fr;
      gap: 1rem;
      position: relative;
      overflow: hidden;
    }
    .hero::after {
      content: '';
      position: absolute;
      inset: auto -110px -110px auto;
      width: 280px;
      height: 280px;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(15, 118, 110, 0.14), transparent 70%);
      pointer-events: none;
    }
    .hero-copy {
      position: relative;
      z-index: 1;
      padding: 0.35rem;
    }
    .hero p {
      max-width: 680px;
      margin: 0.85rem 0 0;
      color: var(--muted);
    }
    .actions {
      margin-top: 1.25rem;
      display: flex;
      gap: 0.75rem;
      flex-wrap: wrap;
    }
    .stats {
      margin-top: 1.5rem;
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 0.75rem;
      max-width: 620px;
    }
    .stats article {
      background: rgba(255, 255, 255, 0.78);
      border-radius: 1rem;
      border: 1px solid rgba(148, 163, 184, 0.24);
      padding: 0.85rem 0.95rem;
      display: flex;
      flex-direction: column;
      gap: 0.2rem;
    }
    .stats strong { font-size: 1.3rem; }
    .stats span { font-size: 0.8rem; color: var(--muted); }
    .hero-side {
      position: relative;
      z-index: 1;
      padding: 1.1rem;
      display: flex;
      flex-direction: column;
      gap: 0.9rem;
      min-height: 100%;
      justify-content: space-between;
    }
    .hero-side h2 {
      margin: 0.25rem 0 0;
      font-size: 1.45rem;
    }
    .spotlight-metrics {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 0.65rem;
    }
    .spotlight-metrics article,
    .mini-track div {
      padding: 0.8rem 0.85rem;
      border-radius: 1rem;
      background: rgba(248, 250, 252, 0.8);
      border: 1px solid rgba(148, 163, 184, 0.22);
    }
    .spotlight-metrics span,
    .mini-track span {
      display: block;
      font-size: 0.75rem;
      color: var(--muted);
      margin-bottom: 0.2rem;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      font-weight: 700;
    }
    .spotlight-metrics strong,
    .mini-track strong {
      font-size: 0.98rem;
    }
    .mini-track {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.65rem;
    }
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
    @media (max-width: 980px) {
      .hero {
        grid-template-columns: 1fr;
      }
    }
    @media (max-width: 720px) {
      .stats,
      .spotlight-metrics,
      .mini-track {
        grid-template-columns: 1fr;
      }
    }
  `,
})
export class HomeComponent implements OnInit {
  private readonly events = inject(EventService);
  featured: Event[] = [];
  upcoming: Event[] = [];
  loading = true;

  get spotlight(): Event | undefined {
    return this.featured[0] ?? this.upcoming[0];
  }

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
