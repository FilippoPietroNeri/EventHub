import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DatePipe, CurrencyPipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSliderModule } from '@angular/material/slider';
import { EventService } from '../../core/event.service';
import { AuthService } from '../../core/auth.service';
import { Event, Review } from '../../core/models';

@Component({
  selector: 'app-event-detail',
  standalone: true,
  imports: [
    DatePipe,
    CurrencyPipe,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatSnackBarModule,
    MatFormFieldModule,
    MatInputModule,
    MatSliderModule,
  ],
  template: `
    @if (event) {
      <section class="hero-card glass-panel">
        <div class="cover-wrap">
          @if (event.cover_image) {
            <img [src]="coverUrl" [alt]="event.title" />
          } @else {
            <div class="cover-fallback">EventHub</div>
          }
        </div>

        <div class="details">
          <h1>{{ event.title }}</h1>
          <p class="location">{{ event.city }} — {{ event.venue }}</p>
          <p class="description">{{ event.description }}</p>

          <div class="meta-grid">
            <article>
              <span>Data</span>
              <strong>{{ event.start_at | date: 'full' }}</strong>
            </article>
            <article>
              <span>Prezzo</span>
              <strong>{{ event.price | currency: 'EUR' }}</strong>
            </article>
            <article>
              <span>Disponibilità</span>
              <strong>{{ event.spots_left }} / {{ event.capacity }}</strong>
            </article>
            <article>
              <span>Rating</span>
              <strong>{{ event.average_rating ?? '—' }}</strong>
            </article>
          </div>

          <div class="actions">
            @if (auth.isLoggedIn && !event.is_past) {
              @if (event.is_registered) {
                <button mat-stroked-button color="warn" (click)="unregister()">Disiscriviti</button>
              } @else {
                <button mat-raised-button color="primary" (click)="register()" [disabled]="event.spots_left === 0 || checkoutPending">
                  {{ event.price > 0 ? 'Acquista biglietto' : 'Iscriviti' }}
                </button>
              }
            } @else if (!auth.isLoggedIn) {
              <small>Accedi per iscriverti all'evento</small>
            }
          </div>
        </div>
      </section>

      <section class="reviews">
        <div class="reviews-head">
          <h2>Recensioni</h2>
          <span>{{ reviews.length }} commenti</span>
        </div>

        @for (r of reviews; track r.id) {
          <mat-card class="review">
            <header>
              <strong>{{ r.user.full_name }}</strong>
              <span>{{ r.rating }}/5</span>
            </header>
            <p>{{ r.comment }}</p>
            @if (auth.isLoggedIn) {
              <button mat-button (click)="report(r.id)">Segnala</button>
            }
          </mat-card>
        } @empty {
          <mat-card class="review empty">
            <p>Nessuna recensione disponibile per ora.</p>
          </mat-card>
        }

        @if (auth.isLoggedIn && event.is_past && event.is_registered) {
          <mat-card class="review-form glass-panel">
            <h3>Lascia una recensione</h3>
            <form [formGroup]="reviewForm" (ngSubmit)="submitReview()">
              <mat-form-field>
                <mat-label>Voto (1-5)</mat-label>
                <input matInput type="number" min="1" max="5" formControlName="rating" />
              </mat-form-field>
              <mat-form-field class="full">
                <mat-label>Commento</mat-label>
                <textarea matInput rows="3" formControlName="comment"></textarea>
              </mat-form-field>
              <button mat-raised-button color="primary" type="submit" [disabled]="reviewForm.invalid">
                Pubblica
              </button>
            </form>
          </mat-card>
        }
      </section>
    }
  `,
  styles: `
    .hero-card {
      padding: 0.5rem;
      border-radius: 1rem;
      border: 1px solid #e2e8f0;
      display: grid;
      grid-template-columns: minmax(280px, 460px) 1fr;
      gap: 1rem;
      align-items: stretch;
    }
    .cover-wrap {
      border-radius: 0.85rem;
      overflow: hidden;
      min-height: 220px;
      background: #e2e8f0;
    }
    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }
    .cover-fallback {
      height: 100%;
      min-height: 220px;
      display: grid;
      place-items: center;
      color: #3730a3;
      font-weight: 700;
      background: linear-gradient(140deg, #e0e7ff, #cffafe);
    }
    .details {
      padding: 0.55rem 0.4rem 0.55rem 0;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }
    h1 {
      margin: 0;
      font-size: clamp(1.4rem, 2.5vw, 2rem);
    }
    .location {
      margin: 0;
      color: #475569;
    }
    .description {
      margin: 0;
      color: #334155;
      line-height: 1.5;
    }
    .meta-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 0.6rem;
    }
    .meta-grid article {
      border: 1px solid #e2e8f0;
      border-radius: 0.75rem;
      padding: 0.6rem 0.7rem;
      background: rgba(255, 255, 255, 0.8);
    }
    .meta-grid span {
      display: block;
      font-size: 0.75rem;
      color: #64748b;
      margin-bottom: 0.2rem;
    }
    .actions {
      margin-top: auto;
      display: flex;
      align-items: center;
      gap: 0.6rem;
    }
    .actions small {
      color: #64748b;
    }
    .reviews { margin-top: 1.4rem; }
    .reviews-head {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      margin-bottom: 0.75rem;
    }
    .reviews-head h2 {
      margin: 0;
    }
    .reviews-head span {
      color: #64748b;
      font-size: 0.9rem;
    }
    .review {
      margin-bottom: 0.75rem;
      border: 1px solid #e2e8f0;
      border-radius: 0.85rem;
    }
    .review header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.35rem;
    }
    .review p {
      margin: 0 0 0.35rem;
      color: #334155;
    }
    .review.empty p {
      margin: 0;
      color: #64748b;
    }
    .review-form {
      padding: 0.65rem;
      margin-top: 1rem;
    }
    .review-form h3 {
      margin: 0.3rem 0 0.8rem;
      padding: 0 0.4rem;
    }
    form { display: flex; flex-direction: column; gap: 0.5rem; max-width: 520px; }
    .full { width: 100%; }
    @media (max-width: 900px) {
      .hero-card {
        grid-template-columns: 1fr;
      }
      .details {
        padding-right: 0.2rem;
      }
      .meta-grid {
        grid-template-columns: 1fr;
      }
    }
  `,
})
export class EventDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly eventsApi = inject(EventService);
  readonly auth = inject(AuthService);
  private readonly snack = inject(MatSnackBar);
  private readonly fb = inject(FormBuilder);

  event?: Event;
  reviews: Review[] = [];
  checkoutPending = false;
  checkoutHandled = false;

  reviewForm = this.fb.group({
    rating: [5, [Validators.required, Validators.min(1), Validators.max(5)]],
    comment: ['', [Validators.required, Validators.minLength(3)]],
  });

  get coverUrl(): string {
    const img = this.event?.cover_image;
    if (!img) return '';
    return img.startsWith('http') ? img : img;
  }

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.load(id);
    this.handleCheckoutReturn(id);
  }

  load(id: number): void {
    this.eventsApi.get(id).subscribe((r) => {
      this.event = r.event;
      this.eventsApi.reviews(id).subscribe((rev) => (this.reviews = rev.reviews));
    });
  }

  register(): void {
    if (!this.event) return;

    if (Number(this.event.price || 0) > 0) {
      this.checkoutPending = true;
      this.eventsApi.createCheckoutSession(this.event.id).subscribe({
        next: (res) => {
          window.location.href = res.checkout_url;
        },
        error: (e) => {
          this.checkoutPending = false;
          this.snack.open(e.error?.message || 'Errore checkout Stripe', 'OK');
        },
      });
      return;
    }

    this.eventsApi.register(this.event.id).subscribe({
      next: () => {
        this.snack.open('Iscrizione confermata!', 'OK', { duration: 3000 });
        this.load(this.event!.id);
      },
      error: (e) => this.snack.open(e.error?.message || 'Errore', 'OK'),
    });
  }

  private handleCheckoutReturn(eventId: number): void {
    this.route.queryParamMap.subscribe((params) => {
      if (this.checkoutHandled) return;
      const status = params.get('checkout');
      const sessionId = params.get('session_id');

      if (status === 'cancel') {
        this.checkoutHandled = true;
        this.checkoutPending = false;
        this.snack.open('Pagamento annullato', 'OK', { duration: 3000 });
        void this.clearCheckoutQueryParams();
        return;
      }

      if (status === 'success' && sessionId) {
        this.checkoutHandled = true;
        this.eventsApi.confirmCheckout(eventId, sessionId).subscribe({
          next: () => {
            this.checkoutPending = false;
            this.snack.open('Pagamento completato, biglietto emesso!', 'OK', {
              duration: 3500,
            });
            this.load(eventId);
            void this.clearCheckoutQueryParams();
          },
          error: (e) => {
            this.checkoutPending = false;
            this.snack.open(e.error?.message || 'Pagamento non confermato', 'OK');
            void this.clearCheckoutQueryParams();
          },
        });
      }
    });
  }

  private async clearCheckoutQueryParams(): Promise<void> {
    await this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {},
      replaceUrl: true,
    });
  }

  unregister(): void {
    if (!this.event) return;
    this.eventsApi.unregister(this.event.id).subscribe({
      next: () => {
        this.snack.open('Disiscrizione completata', 'OK');
        this.load(this.event!.id);
      },
    });
  }

  submitReview(): void {
    if (!this.event || this.reviewForm.invalid) return;
    const { rating, comment } = this.reviewForm.getRawValue();
    this.eventsApi.addReview(this.event.id, rating!, comment!).subscribe({
      next: () => {
        this.snack.open('Recensione pubblicata', 'OK');
        this.load(this.event!.id);
        this.reviewForm.reset({ rating: 5, comment: '' });
      },
      error: (e) => this.snack.open(e.error?.message || 'Errore', 'OK'),
    });
  }

  report(id: number): void {
    this.eventsApi.reportReview(id).subscribe({
      next: () => this.snack.open('Recensione segnalata', 'OK'),
    });
  }
}
