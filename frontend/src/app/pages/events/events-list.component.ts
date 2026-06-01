import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { debounceTime } from 'rxjs';
import { EventService } from '../../core/event.service';
import { Event } from '../../core/models';
import { EventCardComponent } from '../../shared/event-card/event-card.component';

@Component({
  selector: 'app-events-list',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    EventCardComponent,
  ],
  template: `
    <section class="header">
      <h1>Trova il tuo prossimo evento</h1>
      <p>Filtra in tempo reale per città, categoria, data e budget.</p>
    </section>

    <section class="filters-wrap glass-panel">
      <form [formGroup]="form" class="filters">
        <mat-form-field>
          <mat-label>Cerca</mat-label>
          <input matInput formControlName="q" />
        </mat-form-field>
        <mat-form-field>
          <mat-label>Categoria</mat-label>
          <mat-select formControlName="category">
            <mat-option value="">Tutte</mat-option>
            @for (c of categories; track c) {
              <mat-option [value]="c">{{ c }}</mat-option>
            }
          </mat-select>
        </mat-form-field>
        <mat-form-field>
          <mat-label>Città</mat-label>
          <input matInput formControlName="city" />
        </mat-form-field>
        <mat-form-field>
          <mat-label>Prezzo max (€)</mat-label>
          <input matInput type="number" formControlName="max_price" />
        </mat-form-field>
        <mat-form-field>
          <mat-label>Da data</mat-label>
          <input matInput type="date" formControlName="date_from" />
        </mat-form-field>
      </form>

      <div class="quick-actions">
        <button mat-stroked-button (click)="toggleUpcoming()">
          {{ form.getRawValue().upcoming ? 'Solo prossimi: ON' : 'Solo prossimi: OFF' }}
        </button>
        <button mat-button color="primary" (click)="applySort('date_asc')">Data ↑</button>
        <button mat-button color="primary" (click)="applySort('date_desc')">Data ↓</button>
        <button mat-button color="primary" (click)="applySort('price_asc')">Prezzo ↑</button>
        <button mat-button color="primary" (click)="applySort('price_desc')">Prezzo ↓</button>
        <span class="spacer"></span>
        <button mat-stroked-button (click)="resetFilters()">Reset</button>
      </div>
    </section>

    <p class="results">{{ events.length }} eventi trovati</p>

    <div class="grid">
      @for (e of events; track e.id) {
        <app-event-card [event]="e" />
      } @empty {
        <p>Nessun evento trovato.</p>
      }
    </div>
  `,
  styles: `
    .header {
      margin-bottom: 1rem;
    }
    .header h1 {
      margin-bottom: 0.3rem;
    }
    .header p {
      margin: 0;
      color: #475569;
    }
    .filters-wrap {
      padding: 1rem;
      margin-bottom: 1rem;
    }
    .filters {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
      gap: 0.5rem 1rem;
      margin-bottom: 0.75rem;
    }
    .quick-actions {
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
      align-items: center;
    }
    .quick-actions .spacer {
      flex: 1;
    }
    .results {
      font-size: 0.9rem;
      color: #64748b;
      margin-bottom: 0.8rem;
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 1.25rem;
    }
  `,
})
export class EventsListComponent implements OnInit {
  private readonly eventsApi = inject(EventService);
  private readonly fb = inject(FormBuilder);

  events: Event[] = [];
  categories: string[] = [];

  form = this.fb.group({
    q: [''],
    category: [''],
    city: [''],
    max_price: [''],
    date_from: [''],
    upcoming: [true],
    sort: ['date_asc'],
  });

  ngOnInit(): void {
    this.eventsApi.categories().subscribe((r) => (this.categories = r.categories));
    this.form.valueChanges.pipe(debounceTime(300)).subscribe(() => this.search());
    this.search();
  }

  search(): void {
    const v = this.form.getRawValue();
    this.eventsApi
      .list({
        q: v.q || '',
        category: v.category || '',
        city: v.city || '',
        max_price: v.max_price || '',
        date_from: v.date_from ? `${v.date_from}T00:00:00` : '',
        upcoming: v.upcoming ?? true,
      })
      .subscribe((r) => {
        this.events = this.sortEvents(r.events, v.sort || 'date_asc');
      });
  }

  applySort(sort: string): void {
    this.form.patchValue({ sort }, { emitEvent: false });
    this.events = this.sortEvents(this.events, sort);
  }

  toggleUpcoming(): void {
    const value = !this.form.getRawValue().upcoming;
    this.form.patchValue({ upcoming: value });
  }

  resetFilters(): void {
    this.form.reset({
      q: '',
      category: '',
      city: '',
      max_price: '',
      date_from: '',
      upcoming: true,
      sort: 'date_asc',
    });
  }

  private sortEvents(events: Event[], sort: string): Event[] {
    const sorted = [...events];
    switch (sort) {
      case 'date_desc':
        return sorted.sort(
          (a, b) => new Date(b.start_at).getTime() - new Date(a.start_at).getTime()
        );
      case 'price_asc':
        return sorted.sort((a, b) => Number(a.price) - Number(b.price));
      case 'price_desc':
        return sorted.sort((a, b) => Number(b.price) - Number(a.price));
      case 'date_asc':
      default:
        return sorted.sort(
          (a, b) => new Date(a.start_at).getTime() - new Date(b.start_at).getTime()
        );
    }
  }
}
