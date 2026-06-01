import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
  ],
  template: `
    <section class="hero glass-panel">
      <h1>Profilo account</h1>
      <p>Aggiorna i tuoi dati personali e credenziali di accesso.</p>
    </section>

    <section class="layout">
      <mat-card class="glass-panel">
        <h2>Dati personali</h2>
        <form [formGroup]="profileForm" (ngSubmit)="saveProfile()">
          <mat-form-field class="full">
            <mat-label>Nome</mat-label>
            <input matInput formControlName="first_name" />
          </mat-form-field>
          <mat-form-field class="full">
            <mat-label>Cognome</mat-label>
            <input matInput formControlName="last_name" />
          </mat-form-field>
          <mat-form-field class="full">
            <mat-label>Email</mat-label>
            <input matInput type="email" formControlName="email" />
          </mat-form-field>
          <button mat-raised-button color="primary" type="submit">Salva profilo</button>
        </form>
      </mat-card>

      <mat-card class="glass-panel">
        <h2>Sicurezza</h2>
        <p class="hint">La password è gestita da Supabase: puoi inviare un reset sicuro via email.</p>
        <form [formGroup]="pwdForm" (ngSubmit)="savePassword()">
          <mat-form-field class="full">
            <mat-label>Password attuale</mat-label>
            <input matInput type="password" formControlName="current_password" />
          </mat-form-field>
          <mat-form-field class="full">
            <mat-label>Nuova password</mat-label>
            <input matInput type="password" formControlName="new_password" />
          </mat-form-field>
          <button mat-raised-button type="submit" [disabled]="pwdForm.invalid">Aggiorna password</button>
        </form>
      </mat-card>
    </section>
  `,
  styles: `
    .hero {
      padding: 1.1rem 1.4rem;
      margin-bottom: 1rem;
    }
    .hero h1 { margin: 0 0 0.25rem; }
    .hero p { margin: 0; color: #475569; }
    .layout {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
    }
    .full { width: 100%; }
    mat-card {
      padding: 0.8rem;
      border-radius: 1rem;
      border: 1px solid #e2e8f0;
    }
    h2 {
      margin: 0.2rem 0 0.4rem;
      padding: 0 1rem;
      font-size: 1.1rem;
    }
    form { display: flex; flex-direction: column; gap: 0.5rem; padding: 0.5rem 1rem 1rem; }
    .hint { font-size: 0.9rem; color: #64748b; padding: 0 1rem; margin: 0; }
    @media (max-width: 900px) {
      .layout { grid-template-columns: 1fr; }
    }
  `,
})
export class ProfileComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly snack = inject(MatSnackBar);
  private readonly fb = inject(FormBuilder);

  profileForm = this.fb.group({
    first_name: ['', Validators.required],
    last_name: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
  });

  pwdForm = this.fb.group({
    current_password: ['', Validators.required],
    new_password: ['', [Validators.required, Validators.minLength(8)]],
  });

  ngOnInit(): void {
    const u = this.auth.user;
    if (u) {
      this.profileForm.patchValue({
        first_name: u.first_name,
        last_name: u.last_name,
        email: u.email,
      });
    }
  }

  saveProfile(): void {
    this.auth.updateProfile(this.profileForm.getRawValue() as never).subscribe({
      next: () => this.snack.open('Profilo aggiornato', 'OK'),
    });
  }

  savePassword(): void {
    const v = this.pwdForm.getRawValue();
    this.auth.changePassword(v.current_password!, v.new_password!).subscribe({
      next: () => {
        this.snack.open('Password aggiornata', 'OK');
        this.pwdForm.reset();
      },
      error: () => this.snack.open('Password attuale errata', 'OK'),
    });
  }
}
