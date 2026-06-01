import { Component, OnInit, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { EventService } from '../../core/event.service';
import { Ticket } from '../../core/models';

@Component({
  selector: 'app-tickets',
  standalone: true,
  imports: [MatCardModule, MatButtonModule, MatSnackBarModule, DatePipe],
  template: `
    <section class="hero glass-panel">
      <h1>I miei biglietti</h1>
      <p>Gestisci l’accesso agli eventi: codice ticket, QR e dettagli in un solo posto.</p>
    </section>

    <section class="tickets-grid">
      @for (t of tickets; track t.id) {
        <mat-card class="ticket">
          <header>
            <h2>{{ t.event.title }}</h2>
            <p>{{ t.event.start_at | date: 'full' }}</p>
            <small>{{ t.event.venue }}, {{ t.event.city }}</small>
          </header>

          <div class="qr-wrap">
            <img [src]="t.qr_code" alt="QR Code biglietto" class="qr" />
          </div>

          <div class="code-row">
            <div>
              <span class="label">Codice</span>
              <strong>{{ t.ticket_code }}</strong>
            </div>
            <button mat-stroked-button type="button" (click)="copyCode(t.ticket_code)">
              Copia codice
            </button>
          </div>
        </mat-card>
      } @empty {
        <mat-card class="empty glass-panel">
          <h3>Nessun biglietto attivo</h3>
          <p>Quando ti iscrivi o acquisti un evento, il biglietto comparirà qui.</p>
        </mat-card>
      }
    </section>
  `,
  styles: `
    .hero {
      padding: 1.25rem 1.5rem;
      margin-bottom: 1rem;
    }
    .hero h1 {
      margin: 0 0 0.3rem;
    }
    .hero p {
      margin: 0;
      color: var(--muted);
    }
    .tickets-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(290px, 1fr));
      gap: 1rem;
    }
    .ticket {
      border-radius: 1rem;
      border: 1px solid rgba(148, 163, 184, 0.22);
      padding: 0.35rem;
    }
    header h2 {
      margin: 0;
      font-size: 1.1rem;
    }
    header p {
      margin: 0.45rem 0 0.25rem;
      color: #334155;
      font-size: 0.92rem;
    }
    header small {
      color: var(--muted);
    }
    .qr-wrap {
      margin: 1rem 0 0.75rem;
      display: flex;
      justify-content: center;
      background: rgba(248, 250, 252, 0.8);
      border: 1px solid rgba(148, 163, 184, 0.22);
      border-radius: 0.85rem;
      padding: 0.8rem;
    }
    .qr {
      width: 170px;
      height: 170px;
      border-radius: 0.45rem;
      background: #fff;
      padding: 0.25rem;
    }
    .code-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 0.75rem;
    }
    .label {
      display: block;
      font-size: 0.78rem;
      color: var(--muted);
    }
    .empty {
      padding: 1.5rem;
      text-align: center;
    }
  `,
})
export class TicketsComponent implements OnInit {
  private readonly events = inject(EventService);
  private readonly snack = inject(MatSnackBar);
  tickets: Ticket[] = [];

  ngOnInit(): void {
    this.events.myTickets().subscribe((r) => (this.tickets = r.tickets));
  }

  copyCode(code: string): void {
    void navigator.clipboard.writeText(code);
    this.snack.open('Codice biglietto copiato', 'OK', { duration: 2200 });
  }
}
