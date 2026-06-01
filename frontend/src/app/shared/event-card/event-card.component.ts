import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { DatePipe, CurrencyPipe } from '@angular/common';
import { Event } from '../../core/models';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-event-card',
  standalone: true,
  imports: [RouterLink, MatCardModule, MatButtonModule, MatChipsModule, DatePipe, CurrencyPipe],
  template: `
    <mat-card class="event-card">
      <div class="image-wrap">
        @if (event.cover_image) {
          <img mat-card-image [src]="imageUrl" [alt]="event.title" />
        } @else {
          <div class="fallback-cover">
            <span>{{ event.category }}</span>
          </div>
        }
        <div class="image-gradient"></div>
        <div class="top-row">
          <span class="category-pill">{{ event.category }}</span>
          @if (event.featured) {
            <span class="featured-pill">In evidenza</span>
          }
        </div>
      </div>
      <mat-card-header>
        <mat-card-title>{{ event.title }}</mat-card-title>
        <mat-card-subtitle>{{ event.city }} · {{ event.venue }}</mat-card-subtitle>
      </mat-card-header>
      <mat-card-content>
        <p class="meta">{{ event.start_at | date: 'EEE d MMM · HH:mm' }}</p>
        <mat-chip-set class="chips">
          <mat-chip>{{ event.spots_left }} posti</mat-chip>
          <mat-chip>{{ event.price | currency: 'EUR' }}</mat-chip>
        </mat-chip-set>
        <div class="bottom-row">
          <div>
            <p class="price">{{ event.price | currency: 'EUR' }}</p>
            <p class="spots">{{ event.average_rating ?? 'Nuovo' }}</p>
          </div>
          <span class="rating">{{ event.spots_left > 0 ? 'Live' : 'Sold out' }}</span>
        </div>
        <div class="availability">
          <span [style.width.%]="availabilityPercent"></span>
        </div>
      </mat-card-content>
      <mat-card-actions>
        <a mat-stroked-button color="primary" [routerLink]="['/events', event.id]">Dettagli</a>
      </mat-card-actions>
    </mat-card>
  `,
  styles: `
    .event-card {
      height: 100%;
      display: flex;
      flex-direction: column;
      border-radius: 1.35rem;
      overflow: hidden;
      transition: transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease;
      border: 1px solid rgba(148, 163, 184, 0.22);
      background: rgba(255, 255, 255, 0.84);
    }
    .event-card:hover {
      transform: translateY(-6px);
      box-shadow: 0 22px 40px rgba(15, 23, 42, 0.16);
      border-color: rgba(15, 118, 110, 0.18);
    }
    .image-wrap {
      position: relative;
      overflow: hidden;
      min-height: 190px;
      background: linear-gradient(140deg, rgba(15, 118, 110, 0.12), rgba(14, 165, 233, 0.15));
    }
    img {
      width: 100%;
      height: 190px;
      object-fit: cover;
      transition: transform 200ms ease;
      display: block;
    }
    .event-card:hover img {
      transform: scale(1.03);
    }
    .fallback-cover {
      height: 190px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #0f766e;
      background: linear-gradient(135deg, rgba(15, 118, 110, 0.12), rgba(37, 99, 235, 0.12));
      font-weight: 600;
      text-transform: capitalize;
    }
    .image-gradient {
      position: absolute;
      inset: auto 0 0;
      height: 78px;
      background: linear-gradient(180deg, transparent, rgba(15, 23, 42, 0.52));
      pointer-events: none;
    }
    .top-row {
      position: absolute;
      top: 0.75rem;
      left: 0.75rem;
      right: 0.75rem;
      display: flex;
      justify-content: space-between;
      gap: 0.5rem;
      z-index: 1;
    }
    .category-pill,
    .featured-pill,
    .rating {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 0.38rem 0.65rem;
      border-radius: 999px;
      font-size: 0.72rem;
      font-weight: 800;
      letter-spacing: 0.04em;
      text-transform: uppercase;
      backdrop-filter: blur(10px);
    }
    .category-pill {
      color: #0f172a;
      background: rgba(255, 255, 255, 0.9);
    }
    .featured-pill {
      color: #fff;
      background: rgba(15, 118, 110, 0.92);
    }
    .meta { color: var(--muted); font-size: 0.9rem; margin-bottom: 0.7rem; }
    .chips {
      margin-bottom: 0.35rem;
    }
    .bottom-row {
      margin-top: 0.5rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 0.75rem;
    }
    .price { font-weight: 800; margin: 0; color: #0f172a; font-size: 1.05rem; }
    .spots { font-size: 0.84rem; color: var(--muted); margin: 0; }
    .rating {
      color: #0f766e;
      background: rgba(15, 118, 110, 0.12);
    }
    .availability {
      margin-top: 0.5rem;
      height: 6px;
      border-radius: 999px;
      background: rgba(148, 163, 184, 0.2);
      overflow: hidden;
    }
    .availability span {
      display: block;
      height: 100%;
      background: linear-gradient(90deg, #0f766e, #0ea5e9);
    }
  `,
})
export class EventCardComponent {
  @Input({ required: true }) event!: Event;

  get imageUrl(): string {
    const img = this.event.cover_image;
    if (!img) return '';
    if (img.startsWith('http')) return img;
    return img;
  }

  get availabilityPercent(): number {
    if (!this.event.capacity) return 0;
    const percent = (this.event.spots_left / this.event.capacity) * 100;
    return Math.max(0, Math.min(100, Math.round(percent)));
  }
}
