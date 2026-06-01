import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Event, Review, Ticket } from './models';

@Injectable({ providedIn: 'root' })
export class EventService {
  private readonly http = inject(HttpClient);
  private readonly api = environment.apiUrl;

  home() {
    return this.http.get<{ featured: Event[]; upcoming: Event[] }>(
      `${this.api}/events/home`
    );
  }

  list(filters: Record<string, string | number | boolean> = {}) {
    let params = new HttpParams();
    Object.entries(filters).forEach(([k, v]) => {
      if (v !== '' && v !== null && v !== undefined) {
        params = params.set(k, String(v));
      }
    });
    return this.http.get<{ events: Event[] }>(`${this.api}/events`, { params });
  }

  get(id: number) {
    return this.http.get<{ event: Event }>(`${this.api}/events/${id}`);
  }

  categories() {
    return this.http.get<{ categories: string[] }>(`${this.api}/events/categories`);
  }

  register(eventId: number) {
    return this.http.post<{ message: string; registration: Ticket }>(
      `${this.api}/registrations/events/${eventId}`,
      {}
    );
  }

  createCheckoutSession(eventId: number) {
    return this.http.post<{ session_id: string; checkout_url: string; mode: string }>(
      `${this.api}/registrations/events/${eventId}/checkout-session`,
      {}
    );
  }

  confirmCheckout(eventId: number, sessionId: string) {
    return this.http.post<{ message: string; registration?: Ticket }>(
      `${this.api}/registrations/events/${eventId}/checkout-confirm`,
      { session_id: sessionId }
    );
  }

  unregister(eventId: number) {
    return this.http.delete<{ message: string }>(
      `${this.api}/registrations/events/${eventId}`
    );
  }

  myTickets() {
    return this.http.get<{ tickets: Ticket[] }>(
      `${this.api}/registrations/me/tickets`
    );
  }

  reviews(eventId: number) {
    return this.http.get<{ reviews: Review[] }>(
      `${this.api}/reviews/events/${eventId}`
    );
  }

  addReview(eventId: number, rating: number, comment: string) {
    return this.http.post(`${this.api}/reviews/events/${eventId}`, {
      rating,
      comment,
    });
  }

  reportReview(reviewId: number) {
    return this.http.post(`${this.api}/reviews/${reviewId}/report`, {});
  }
}
