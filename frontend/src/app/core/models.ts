export type UserRole = 'user' | 'organizer' | 'admin';

export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  role: UserRole;
  is_banned?: boolean;
}

export interface Event {
  id: number;
  title: string;
  description: string;
  category: string;
  city: string;
  venue: string;
  start_at: string;
  price: number;
  capacity: number;
  spots_left: number;
  cover_image?: string | null;
  featured: boolean;
  is_past: boolean;
  average_rating?: number | null;
  is_registered?: boolean;
  organizer: Pick<User, 'id' | 'full_name' | 'first_name' | 'last_name' | 'role'>;
}

export interface Ticket {
  id: number;
  ticket_code: string;
  status: string;
  registered_at: string;
  qr_code: string;
  event: Event;
}

export interface Review {
  id: number;
  rating: number;
  comment: string;
  created_at: string;
  user: { id: string; full_name: string };
}
