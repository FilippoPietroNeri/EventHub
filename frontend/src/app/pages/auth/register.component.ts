import { Component, inject } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from '../../core/auth.service';

function passwordMatch(group: AbstractControl): ValidationErrors | null {
  const p = group.get('password')?.value;
  const c = group.get('confirm')?.value;
  return p === c ? null : { mismatch: true };
}

@Component({
  selector: 'app-register',
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
      <mat-card class="auth-card glass-panel">
        <mat-card-title>Crea il tuo account</mat-card-title>
        <p>
          Registrazione tramite Supabase Auth. Il profilo EventHub viene sincronizzato
          automaticamente al primo accesso.
        </p>
        <form [formGroup]="form" (ngSubmit)="submit()">
          <mat-form-field class="full"><mat-label>Nome</mat-label><input matInput formControlName="first_name" /></mat-form-field>
          <mat-form-field class="full"><mat-label>Cognome</mat-label><input matInput formControlName="last_name" /></mat-form-field>
          <mat-form-field class="full"><mat-label>Email</mat-label><input matInput type="email" formControlName="email" /></mat-form-field>
          <mat-form-field class="full"><mat-label>Password</mat-label><input matInput type="password" formControlName="password" /></mat-form-field>
          <mat-form-field class="full"><mat-label>Conferma</mat-label><input matInput type="password" formControlName="confirm" /></mat-form-field>
          @if (form.hasError('mismatch')) { <p class="error">Le password non coincidono</p> }
          <button mat-raised-button color="primary" type="submit" [disabled]="form.invalid">Registrati</button>
        </form>
        <p class="mt"><a routerLink="/auth/login">Hai già un account?</a></p>
      </mat-card>

      <aside class="showcase glass-panel">
        <h2>Perché EventHub</h2>
        <div class="feature">
          <strong>Discovery veloce</strong>
          <span>Cerca eventi per città, categoria e budget in tempo reale.</span>
        </div>
        <div class="feature">
          <strong>Biglietti digitali</strong>
          <span>QR ticket pronti nell’area personale.</span>
        </div>
        <div class="feature">
          <strong>Organizer toolkit</strong>
          <span>Dashboard, gestione eventi ed export partecipanti.</span>
        </div>
      </aside>
    </section>
  `,
  styles: `
    .auth-shell {
      display: grid;
      grid-template-columns: 1fr 0.95fr;
      gap: 1rem;
      align-items: stretch;
      margin-top: 0.6rem;
    }
    .auth-card {
      padding: 1rem;
    }
    .showcase {
      padding: 1.25rem;
    }
    .showcase h2 {
      margin-top: 0;
    }
    .feature {
      display: flex;
      flex-direction: column;
      gap: 0.15rem;
      padding: 0.75rem;
      border-radius: 0.75rem;
      background: rgba(255, 255, 255, 0.7);
      border: 1px solid #e2e8f0;
      margin-bottom: 0.6rem;
    }
    .feature span {
      font-size: 0.92rem;
      color: #475569;
    }
    .full { width: 100%; }
    form { display: flex; flex-direction: column; gap: 0.5rem; }
    .error { color: #c62828; font-size: 0.85rem; }
    .mt { margin-top: 1rem; }
    @media (max-width: 900px) {
      .auth-shell {
        grid-template-columns: 1fr;
      }
    }
  `,
})
export class RegisterComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly snack = inject(MatSnackBar);
  private readonly fb = inject(FormBuilder);

  form = this.fb.group(
    {
      first_name: ['', Validators.required],
      last_name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirm: ['', Validators.required],
    },
    { validators: passwordMatch }
  );

  submit(): void {
    if (this.form.invalid) return;
    const v = this.form.getRawValue();
    this.auth
      .register({
        email: v.email!,
        password: v.password!,
        first_name: v.first_name!,
        last_name: v.last_name!,
      })
      .subscribe({
        next: () => {
          this.snack.open('Controlla l’email per confermare l’account (se richiesto)', 'OK');
          this.router.navigate(['/auth/login']);
        },
        error: (e) => this.snack.open(e.message || 'Errore registrazione', 'OK'),
      });
  }
}
