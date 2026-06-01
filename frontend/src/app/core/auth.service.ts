import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { BehaviorSubject, Observable, from, switchMap, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { AccountLimitedDialogComponent } from './account-limited-dialog.component';
import { User, UserRole } from './models';
import { SupabaseService } from './supabase.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);
  private readonly supabase = inject(SupabaseService).client;
  private readonly api = environment.apiUrl;

  private readonly currentUser$ = new BehaviorSubject<User | null>(null);
  private initDone = false;
  private bannedAlertShown = false;

  readonly user$ = this.currentUser$.asObservable();

  get user(): User | null {
    return this.currentUser$.value;
  }

  get accessToken(): string | null {
    return null;
  }

  async getAccessToken(): Promise<string | null> {
    const { data } = await this.supabase.auth.getSession();
    return data.session?.access_token ?? null;
  }

  get isLoggedIn(): boolean {
    return !!this.user;
  }

  hasRole(...roles: UserRole[]): boolean {
    return !!this.user && roles.includes(this.user.role);
  }

  /** Chiamato da APP_INITIALIZER */
  init(): Promise<void> {
    return this.supabase.auth.getSession().then(({ data }) => {
      this.initDone = true;
      if (data.session) {
        return this.loadProfileFromApi().catch(() => undefined);
      }
      return undefined;
    });
  }

  login(email: string, password: string): Observable<void> {
    return from(
      this.supabase.auth.signInWithPassword({ email, password })
    ).pipe(
      switchMap(({ error }) => {
        if (error) throw error;
        return this.fetchMe();
      }),
      tap(() => this.router.navigate(['/'])),
      switchMap(() => from(Promise.resolve()))
    );
  }

  register(payload: {
    email: string;
    password: string;
    first_name: string;
    last_name: string;
  }): Observable<void> {
    return from(
      this.supabase.auth.signUp({
        email: payload.email,
        password: payload.password,
        options: {
          data: {
            first_name: payload.first_name,
            last_name: payload.last_name,
            full_name: `${payload.first_name} ${payload.last_name}`,
          },
        },
      })
    ).pipe(
      switchMap(({ error }) => {
        if (error) throw error;
        return from(Promise.resolve());
      })
    );
  }

  async logout(): Promise<void> {
    await this.supabase.auth.signOut();
    this.currentUser$.next(null);
    localStorage.removeItem('user');
    this.router.navigate(['/']);
  }

  notifyLimitedAccountAccess(message?: string): void {
    if (this.bannedAlertShown) return;
    this.bannedAlertShown = true;

    const dialogRef = this.dialog.open(AccountLimitedDialogComponent, {
      disableClose: true,
      width: '420px',
      data: {
        message:
          message ||
          "Il tuo account è stato sospeso. L'accesso è limitato: contatta il supporto per maggiori informazioni.",
      },
    });

    dialogRef.afterClosed().subscribe(() => {
      void this.logout();
    });
  }

  fetchMe(): Observable<{ user: User }> {
    return this.http.get<{ user: User }>(`${this.api}/auth/me`).pipe(
      tap((res) => {
        this.currentUser$.next(res.user);
        localStorage.setItem('user', JSON.stringify(res.user));
      })
    );
  }

  loadProfileFromApi(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.fetchMe().subscribe({ next: () => resolve(), error: reject });
    });
  }

  updateProfile(data: Partial<User>): Observable<{ user: User }> {
    return this.http.patch<{ user: User }>(`${this.api}/users/me`, data).pipe(
      tap((res) => {
        this.currentUser$.next(res.user);
        localStorage.setItem('user', JSON.stringify(res.user));
      })
    );
  }

  changePassword(_current: string, _new: string): Observable<{ message: string }> {
    return from(
      this.supabase.auth.resetPasswordForEmail(this.user?.email ?? '', {
        redirectTo: `${window.location.origin}/account/profile`,
      })
    ).pipe(
      switchMap(({ error }) => {
        if (error) throw error;
        return from(
          Promise.resolve({
            message: 'Email di reset password inviata (Supabase Auth)',
          })
        );
      })
    );
  }
}
