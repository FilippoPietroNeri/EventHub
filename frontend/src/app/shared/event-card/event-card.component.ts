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
      </div>
      <mat-card-header>
        <mat-card-title>{{ event.title }}</mat-card-title>
        <mat-card-subtitle>{{ event.city }} · {{ event.venue }}</mat-card-subtitle>
      </mat-card-header>
      <mat-card-content>
        <p class="meta">{{ event.start_at | date: 'medium' }}</p>
        <mat-chip-set>
          <mat-chip>{{ event.category }}</mat-chip>
          @if (event.featured) {
            <mat-chip color="accent">In evidenza</mat-chip>
          }
        </mat-chip-set>
        <div class="bottom-row">
          <p class="price">{{ event.price | currency: 'EUR' }}</p>
          <p class="spots">{{ event.spots_left }} posti</p>
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
      border: 1px solid #e2e8f0;
      border-radius: 1rem;
      overflow: hidden;
      transition: transform 180ms ease, box-shadow 180ms ease;
    }
    .event-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 14px 24px rgba(15, 23, 42, 0.12);
    }
    .image-wrap {
      overflow: hidden;
      max-height: 180px;
      background: #e2e8f0;
    }
    img {
      width: 100%;
      max-height: 180px;
      object-fit: cover;
      transition: transform 200ms ease;
    }
    .event-card:hover img {
      transform: scale(1.03);
    }
    .fallback-cover {
      height: 180px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #3730a3;
      background: linear-gradient(135deg, #e0e7ff, #cffafe);
      font-weight: 600;
      text-transform: capitalize;
    }
    .meta { color: #475569; font-size: 0.9rem; }
    .bottom-row {
      margin-top: 0.5rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 0.75rem;
    }
    .price { font-weight: 700; margin: 0; color: #0f172a; }
    .spots { font-size: 0.85rem; color: #64748b; margin: 0; }
    .availability {
      margin-top: 0.5rem;
      height: 6px;
      border-radius: 999px;
      background: #e2e8f0;
      overflow: hidden;
    }
    .availability span {
      display: block;
      height: 100%;
      background: linear-gradient(90deg, #4f46e5, #06b6d4);
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
