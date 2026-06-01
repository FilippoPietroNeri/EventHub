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
    <section class="header glass-panel">
      <div>
        <span class="eyebrow">Discovery feed</span>
        <h1 class="page-heading">Trova il tuo prossimo evento</h1>
        <p class="muted">Filtra in tempo reale per città, categoria, data e budget.</p>
      </div>
      <div class="header-stats">
        <article>
          <strong>{{ events.length }}</strong>
          <span>risultati</span>
        </article>
        <article>
          <strong>{{ categories.length }}</strong>
          <span>categorie</span>
        </article>
      </div>
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

    <div class="section-title">
      <div>
        <h2>{{ events.length }} eventi trovati</h2>
        <p>Mostrati in un layout più chiaro e leggibile.</p>
      </div>
    </div>

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
      padding: 1.2rem 1.25rem;
      display: flex;
      align-items: end;
      justify-content: space-between;
      gap: 1rem;
    }
    .header h1 {
      margin: 0.35rem 0 0.3rem;
      max-width: 12ch;
    }
    .header p {
      margin: 0;
    }
    .filters-wrap {
      padding: 1rem 1rem 0.85rem;
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
    .header-stats {
      display: flex;
      gap: 0.65rem;
      flex-wrap: wrap;
    }
    .header-stats article {
      min-width: 110px;
      padding: 0.8rem 0.9rem;
      border-radius: 1rem;
      background: rgba(255, 255, 255, 0.72);
      border: 1px solid rgba(148, 163, 184, 0.22);
      display: flex;
      flex-direction: column;
      gap: 0.15rem;
    }
    .header-stats strong {
      font-size: 1.2rem;
    }
    .header-stats span {
      color: var(--muted);
      font-size: 0.78rem;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      font-weight: 700;
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 1.25rem;
    }
    @media (max-width: 900px) {
      .header {
        flex-direction: column;
        align-items: start;
      }
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
