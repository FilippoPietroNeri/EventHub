import { Component, OnInit, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSnackBar } from '@angular/material/snack-bar';
import { OrganizerService } from '../../core/organizer.service';
import { Event as HubEvent } from '../../core/models';

@Component({
  selector: 'app-events-manage',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatCheckboxModule,
    DatePipe,
  ],
  template: `
    <section class="hero glass-panel">
      <h1>Gestione eventi</h1>
      <p>Crea, modifica e pubblica i tuoi eventi in pochi passaggi.</p>
    </section>

    <section class="layout">
      <mat-card class="glass-panel">
        <h2>{{ editing ? 'Modifica' : 'Nuovo' }} evento</h2>
        <form [formGroup]="form" (ngSubmit)="save()" enctype="multipart/form-data">
          <mat-form-field class="full"><mat-label>Titolo</mat-label><input matInput formControlName="title" /></mat-form-field>
          <mat-form-field class="full"><mat-label>Descrizione</mat-label><textarea matInput rows="4" formControlName="description"></textarea></mat-form-field>
          <div class="row">
            <mat-form-field class="full"><mat-label>Categoria</mat-label><input matInput formControlName="category" /></mat-form-field>
            <mat-form-field class="full"><mat-label>Città</mat-label><input matInput formControlName="city" /></mat-form-field>
          </div>
          <mat-form-field class="full"><mat-label>Luogo</mat-label><input matInput formControlName="venue" /></mat-form-field>
          <div class="row">
            <mat-form-field class="full"><mat-label>Data/ora</mat-label><input matInput type="datetime-local" formControlName="start_at" /></mat-form-field>
            <mat-form-field class="full"><mat-label>Prezzo</mat-label><input matInput type="number" formControlName="price" /></mat-form-field>
            <mat-form-field class="full"><mat-label>Capienza</mat-label><input matInput type="number" formControlName="capacity" /></mat-form-field>
          </div>
          <mat-checkbox formControlName="featured">In evidenza</mat-checkbox>
          <div class="file">
            <label>Locandina (upload file)</label>
            <input type="file" accept="image/*" (change)="onFile($event)" />
          </div>
          <div class="actions">
            <button mat-raised-button color="primary" type="submit">{{ editing ? 'Aggiorna' : 'Crea' }}</button>
            @if (editing) {
              <button mat-button type="button" (click)="cancelEdit()">Annulla</button>
            }
          </div>
        </form>
      </mat-card>

      <section>
        <h2 class="mt">I tuoi eventi</h2>
        @for (e of events; track e.id) {
          <mat-card class="item glass-panel">
            <div>
              <strong>{{ e.title }}</strong>
              <small>{{ e.start_at | date: 'fullDate' }} · {{ e.city }}</small>
            </div>
            <span>
              <button mat-button (click)="edit(e)">Modifica</button>
              <button mat-button color="warn" (click)="remove(e.id)">Elimina</button>
            </span>
          </mat-card>
        } @empty {
          <mat-card class="item empty glass-panel">
            <p>Non hai ancora creato eventi.</p>
          </mat-card>
        }
      </section>
    </section>
  `,
  styles: `
    .hero {
      padding: 1.1rem 1.4rem;
      margin-bottom: 1rem;
    }
    .hero h1 { margin: 0 0 0.2rem; }
    .hero p { margin: 0; color: #475569; }
    .layout {
      display: grid;
      grid-template-columns: 1.25fr 1fr;
      gap: 1rem;
    }
    mat-card {
      border: 1px solid #e2e8f0;
      border-radius: 1rem;
      padding: 0.6rem;
    }
    .full { width: 100%; }
    .row {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 0.6rem;
    }
    form { display: flex; flex-direction: column; gap: 0.5rem; padding: 0.6rem; }
    .file { margin: 0.5rem 0; }
    .actions {
      display: flex;
      gap: 0.5rem;
      align-items: center;
    }
    .item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.8rem 0.9rem;
      margin-bottom: 0.5rem;
      border: 1px solid #e2e8f0;
      border-radius: 0.9rem;
    }
    .item div {
      display: flex;
      flex-direction: column;
      gap: 0.15rem;
    }
    .item small {
      color: #64748b;
    }
    .item.empty {
      justify-content: center;
    }
    .mt { margin: 0 0 0.6rem; }
    @media (max-width: 1100px) {
      .layout {
        grid-template-columns: 1fr;
      }
      .row {
        grid-template-columns: 1fr;
      }
    }
  `,
})
export class EventsManageComponent implements OnInit {
  private readonly org = inject(OrganizerService);
  private readonly snack = inject(MatSnackBar);
  private readonly fb = inject(FormBuilder);

  events: HubEvent[] = [];
  editing: number | null = null;
  coverFile: File | null = null;

  form = this.fb.group({
    title: ['', Validators.required],
    description: ['', Validators.required],
    category: ['concerto', Validators.required],
    city: ['', Validators.required],
    venue: ['', Validators.required],
    start_at: ['', Validators.required],
    price: [0, Validators.required],
    capacity: [50, [Validators.required, Validators.min(1)]],
    featured: [false],
  });

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.org.myEvents().subscribe((r) => (this.events = r.events));
  }

  onFile(ev: globalThis.Event): void {
    const input = ev.target as HTMLInputElement;
    this.coverFile = input.files?.[0] ?? null;
  }

  toFormData(): FormData {
    const v = this.form.getRawValue();
    const fd = new FormData();
    Object.entries(v).forEach(([k, val]) => {
      if (k === 'start_at' && val) {
        fd.append(k, new Date(val as string).toISOString());
      } else if (k === 'featured') {
        fd.append(k, String(val));
      } else if (val !== null && val !== undefined) {
        fd.append(k, String(val));
      }
    });
    if (this.coverFile) fd.append('cover_image', this.coverFile);
    return fd;
  }

  save(): void {
    if (this.form.invalid) return;
    const fd = this.toFormData();
    const req = this.editing
      ? this.org.updateEvent(this.editing, fd)
      : this.org.createEvent(fd);
    req.subscribe({
      next: () => {
        this.snack.open('Evento salvato', 'OK');
        this.form.reset({ category: 'concerto', capacity: 50, price: 0, featured: false });
        this.editing = null;
        this.coverFile = null;
        this.load();
      },
      error: (e) => this.snack.open(e.error?.message || 'Errore', 'OK'),
    });
  }

  edit(e: HubEvent): void {
    this.editing = e.id;
    this.form.patchValue({
      title: e.title,
      description: e.description,
      category: e.category,
      city: e.city,
      venue: e.venue,
      start_at: e.start_at.slice(0, 16),
      price: e.price,
      capacity: e.capacity,
      featured: e.featured,
    });
  }

  cancelEdit(): void {
    this.editing = null;
    this.form.reset({ category: 'concerto', capacity: 50, price: 0, featured: false });
  }

  remove(id: number): void {
    if (!confirm('Eliminare l\'evento?')) return;
    this.org.deleteEvent(id).subscribe(() => this.load());
  }
}
