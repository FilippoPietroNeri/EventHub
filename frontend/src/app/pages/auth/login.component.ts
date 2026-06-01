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
        <span class="eyebrow">Welcome back</span>
        <h1>Torna su EventHub</h1>
        <p>Accedi per gestire biglietti, iscrizioni e i tuoi eventi preferiti in una dashboard più pulita.</p>
        <div class="feature-list">
          <article>
            <strong>QR wallet</strong>
            <span>Biglietti sempre disponibili nell’area personale.</span>
          </article>
          <article>
            <strong>Stripe checkout</strong>
            <span>Acquisti rapidi e conferme immediate.</span>
          </article>
          <article>
            <strong>Organizer tools</strong>
            <span>Metriche, export e gestione eventi con meno click.</span>
          </article>
        </div>
      </aside>

      <mat-card class="auth-card glass-panel">
        <mat-card-title>Accedi</mat-card-title>
        <p class="muted">Autenticazione con <strong>Supabase Auth</strong>.</p>
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
      grid-template-columns: 1.1fr 0.9fr;
      gap: 1rem;
      align-items: stretch;
      margin-top: 0.6rem;
    }
    .showcase {
      padding: 1.4rem;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      gap: 1rem;
    }
    .showcase h1 {
      margin: 0.3rem 0 0;
      font-size: clamp(2rem, 4vw, 2.9rem);
      max-width: 12ch;
    }
    .showcase p {
      margin-top: 0;
      color: var(--muted);
    }
    .feature-list {
      display: grid;
      gap: 0.7rem;
    }
    .feature-list article {
      padding: 0.85rem 0.9rem;
      border-radius: 1rem;
      background: rgba(255, 255, 255, 0.72);
      border: 1px solid rgba(148, 163, 184, 0.2);
      display: flex;
      flex-direction: column;
      gap: 0.15rem;
    }
    .feature-list span {
      color: var(--muted);
      font-size: 0.92rem;
    }
    .auth-card {
      padding: 1.15rem;
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
