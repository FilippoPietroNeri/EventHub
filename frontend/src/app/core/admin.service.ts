import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { User, UserRole } from './models';

@Injectable({ providedIn: 'root' })
export class AdminService {
  private readonly http = inject(HttpClient);
  private readonly api = environment.apiUrl;

  users() {
    return this.http.get<{ users: User[] }>(`${this.api}/admin/users`);
  }

  updateUser(id: string, data: { role?: UserRole; is_banned?: boolean }) {
    return this.http.patch(`${this.api}/admin/users/${id}`, data);
  }

  reportedReviews() {
    return this.http.get<{ reviews: Array<{
      id: number;
      rating: number;
      comment: string;
      event_id: number;
      event_title: string;
      user: User;
      created_at: string;
    }> }>(`${this.api}/admin/reviews/reported`);
  }

  moderateReview(id: number, action: 'hide' | 'dismiss') {
    return this.http.post(`${this.api}/admin/reviews/${id}/moderate`, { action });
  }
}
