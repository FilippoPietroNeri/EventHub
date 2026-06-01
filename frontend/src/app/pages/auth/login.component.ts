import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
  ],
  template: `
    <section class="auth-shell">
      <aside class="showcase glass-panel">
        <h1>Torna su EventHub</h1>
        <p>Accedi per gestire biglietti, iscrizioni e i tuoi eventi preferiti.</p>
        <ul>
          <li>Biglietti sempre disponibili con QR</li>
          <li>Checkout Stripe in test mode</li>
          <li>Dashboard organizer per metriche e export CSV</li>
        </ul>
      </aside>

      <mat-card class="auth-card glass-panel">
        <mat-card-title>Accedi</mat-card-title>
        <p>Autenticazione con <strong>Supabase Auth</strong>.</p>
        <form [formGroup]="form" (ngSubmit)="submit()">
          <mat-form-field class="full">
            <mat-label>Email</mat-label>
            <input matInput type="email" formControlName="email" />
          </mat-form-field>
          <mat-form-field class="full">
            <mat-label>Password</mat-label>
            <input matInput type="password" formControlName="password" />
          </mat-form-field>
          <button mat-raised-button color="primary" type="submit" [disabled]="form.invalid">
            Entra
          </button>
        </form>
        <p class="mt"><a routerLink="/auth/register">Crea un account</a></p>
      </mat-card>
    </section>
  `,
  styles: `
    .auth-shell {
      display: grid;
      grid-template-columns: 1.15fr 1fr;
      gap: 1rem;
      align-items: stretch;
      margin-top: 0.6rem;
    }
    .showcase {
      padding: 1.35rem;
    }
    .showcase h1 {
      margin-top: 0;
      margin-bottom: 0.5rem;
      font-size: clamp(1.5rem, 3vw, 2rem);
    }
    .showcase p {
      margin-top: 0;
      color: #475569;
    }
    .showcase ul {
      margin: 1rem 0 0;
      padding-left: 1.2rem;
      color: #334155;
      line-height: 1.5;
    }
    .auth-card {
      padding: 1rem;
    }
    .full { width: 100%; }
    form { display: flex; flex-direction: column; gap: 0.5rem; }
    .mt { margin-top: 1rem; }
    @media (max-width: 900px) {
      .auth-shell {
        grid-template-columns: 1fr;
      }
    }
  `,
})
export class LoginComponent {
  private readonly auth = inject(AuthService);
  private readonly snack = inject(MatSnackBar);
  private readonly fb = inject(FormBuilder);

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  submit(): void {
    if (this.form.invalid) return;
    const { email, password } = this.form.getRawValue();
    this.auth.login(email!, password!).subscribe({
      error: (e) => this.snack.open(e.message || 'Login fallito', 'OK'),
    });
  }
}
