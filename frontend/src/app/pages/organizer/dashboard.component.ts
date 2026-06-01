import { Component, OnInit, inject } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { OrganizerService } from '../../core/organizer.service';

@Component({
  selector: 'app-organizer-dashboard',
  standalone: true,
  imports: [MatTableModule, MatCardModule, MatButtonModule, CurrencyPipe],
  template: `
    <section class="hero glass-panel">
      <h1>Dashboard organizzatore</h1>
      <p>Monitora performance degli eventi, iscrizioni e incasso stimato.</p>
    </section>

    @if (summary) {
      <div class="stats">
        <mat-card class="glass-panel"><strong>{{ summary.total_events }}</strong><span>Eventi</span></mat-card>
        <mat-card class="glass-panel"><strong>{{ summary.total_registrations }}</strong><span>Iscrizioni</span></mat-card>
        <mat-card class="glass-panel"><strong>{{ summary.total_estimated_revenue | currency: 'EUR' }}</strong><span>Incasso stimato</span></mat-card>
      </div>
    }

    <section class="toolbar">
      <button mat-button color="primary" (click)="sortBy('start_at')">Ordina per data</button>
      <button mat-button color="primary" (click)="sortBy('registrations')">Ordina per iscritti</button>
      <button mat-button color="primary" (click)="sortBy('estimated_revenue')">Ordina per incasso</button>
    </section>

    <mat-card class="table-wrap glass-panel">
      <table mat-table [dataSource]="rows">
        <ng-container matColumnDef="title">
          <th mat-header-cell *matHeaderCellDef>Evento</th>
          <td mat-cell *matCellDef="let r">{{ r.title }}</td>
        </ng-container>
        <ng-container matColumnDef="registrations">
          <th mat-header-cell *matHeaderCellDef>Iscritti</th>
          <td mat-cell *matCellDef="let r">{{ r.registrations }}/{{ r.capacity }}</td>
        </ng-container>
        <ng-container matColumnDef="revenue">
          <th mat-header-cell *matHeaderCellDef>Incasso</th>
          <td mat-cell *matCellDef="let r">{{ r.estimated_revenue | currency: 'EUR' }}</td>
        </ng-container>
        <ng-container matColumnDef="rating">
          <th mat-header-cell *matHeaderCellDef>Rating</th>
          <td mat-cell *matCellDef="let r">{{ r.average_rating ?? '—' }}</td>
        </ng-container>
        <ng-container matColumnDef="actions">
          <th mat-header-cell *matHeaderCellDef></th>
          <td mat-cell *matCellDef="let r">
            <button mat-stroked-button (click)="export(r.event_id)">CSV iscritti</button>
          </td>
        </ng-container>
        <tr mat-header-row *matHeaderRowDef="cols"></tr>
        <tr mat-row *matRowDef="let row; columns: cols"></tr>
      </table>
    </mat-card>
  `,
  styles: `
    .hero {
      padding: 1.1rem 1.4rem;
      margin-bottom: 1rem;
    }
    .hero h1 { margin: 0 0 0.2rem; }
    .hero p { margin: 0; color: #475569; }
    .stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
      gap: 0.8rem;
      margin-bottom: 1rem;
    }
    .stats mat-card {
      text-align: center;
      padding: 1rem;
      border: 1px solid #e2e8f0;
      border-radius: 0.9rem;
    }
    .stats strong { display: block; font-size: 1.4rem; }
    .stats span { color: #64748b; font-size: 0.86rem; }
    .toolbar {
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
      margin-bottom: 0.7rem;
    }
    .table-wrap {
      border-radius: 1rem;
      border: 1px solid #e2e8f0;
      overflow: auto;
      padding: 0.35rem;
    }
    table { width: 100%; }
  `,
})
export class OrganizerDashboardComponent implements OnInit {
  private readonly org = inject(OrganizerService);
  cols = ['title', 'registrations', 'revenue', 'rating', 'actions'];
  rows: Array<{
    event_id: number;
    title: string;
    registrations: number;
    capacity: number;
    estimated_revenue: number;
    average_rating: number | null;
    start_at: string;
  }> = [];
  summary?: { total_events: number; total_registrations: number; total_estimated_revenue: number };

  ngOnInit(): void {
    this.org.dashboard().subscribe((r) => {
      this.rows = r.events;
      this.summary = r.summary;
    });
  }

  export(eventId: number): void {
    this.org.exportCsv(eventId).subscribe((blob) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `iscritti_${eventId}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    });
  }

  sortBy(field: 'start_at' | 'registrations' | 'estimated_revenue'): void {
    this.rows = [...this.rows].sort((a, b) => {
      if (field === 'start_at') {
        return new Date(a.start_at).getTime() - new Date(b.start_at).getTime();
      }
      return Number(b[field]) - Number(a[field]);
    });
  }
}
