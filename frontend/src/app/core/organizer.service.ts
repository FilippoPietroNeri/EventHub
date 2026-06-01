import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Event } from './models';

@Injectable({ providedIn: 'root' })
export class OrganizerService {
  private readonly http = inject(HttpClient);
  private readonly api = environment.apiUrl;

  dashboard() {
    return this.http.get<{
      events: Array<{
        event_id: number;
        title: string;
        registrations: number;
        capacity: number;
        estimated_revenue: number;
        average_rating: number | null;
        start_at: string;
      }>;
      summary: {
        total_events: number;
        total_registrations: number;
        total_estimated_revenue: number;
      };
    }>(`${this.api}/organizer/dashboard`);
  }

  myEvents() {
    return this.http.get<{ events: Event[] }>(`${this.api}/organizer/events`);
  }

  createEvent(formData: FormData) {
    return this.http.post<{ event: Event }>(`${this.api}/organizer/events`, formData);
  }

  updateEvent(id: number, formData: FormData) {
    return this.http.put<{ event: Event }>(`${this.api}/organizer/events/${id}`, formData);
  }

  deleteEvent(id: number) {
    return this.http.delete(`${this.api}/organizer/events/${id}`);
  }

  exportCsv(eventId: number) {
    return this.http.get(`${this.api}/registrations/organizer/events/${eventId}/export`, {
      responseType: 'blob',
    });
  }
}
