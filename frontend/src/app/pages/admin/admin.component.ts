import { Component, OnInit, inject } from '@angular/core';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatCardModule } from '@angular/material/card';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AdminService } from '../../core/admin.service';
import { User, UserRole } from '../../core/models';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [MatTableModule, MatButtonModule, MatSelectModule, MatCardModule],
  template: `
    <h1>Amministrazione</h1>

    <h2>Utenti</h2>
    <table mat-table [dataSource]="users" class="mat-elevation-z1">
      <ng-container matColumnDef="name">
        <th mat-header-cell *matHeaderCellDef>Nome</th>
        <td mat-cell *matCellDef="let u">{{ u.full_name }}</td>
      </ng-container>
      <ng-container matColumnDef="email">
        <th mat-header-cell *matHeaderCellDef>Email</th>
        <td mat-cell *matCellDef="let u">{{ u.email }}</td>
      </ng-container>
      <ng-container matColumnDef="role">
        <th mat-header-cell *matHeaderCellDef>Ruolo</th>
        <td mat-cell *matCellDef="let u">{{ u.role }}</td>
      </ng-container>
      <ng-container matColumnDef="actions">
        <th mat-header-cell *matHeaderCellDef>Azioni</th>
        <td mat-cell *matCellDef="let u">
          <button mat-button (click)="promote(u, 'organizer')">Organizzatore</button>
          <button mat-button (click)="ban(u, true)">Ban</button>
          <button mat-button (click)="ban(u, false)">Sbanna</button>
        </td>
      </ng-container>
      <tr mat-header-row *matHeaderRowDef="userCols"></tr>
      <tr mat-row *matRowDef="let row; columns: userCols"></tr>
    </table>

    <h2 class="mt">Recensioni segnalate</h2>
    @for (r of reviews; track r.id) {
      <mat-card class="review">
        <p><strong>{{ r.event_title }}</strong> — {{ r.user.full_name }} ({{ r.rating }}/5)</p>
        <p>{{ r.comment }}</p>
        <button mat-button (click)="moderate(r.id, 'hide')">Nascondi</button>
        <button mat-button (click)="moderate(r.id, 'dismiss')">Ignora segnalazione</button>
      </mat-card>
    } @empty {
      <p>Nessuna recensione segnalata.</p>
    }
  `,
  styles: `
    table { width: 100%; }
    .mt { margin-top: 2rem; }
    .review { margin-bottom: 1rem; padding: 1rem; }
  `,
})
export class AdminComponent implements OnInit {
  private readonly admin = inject(AdminService);
  private readonly snack = inject(MatSnackBar);

  userCols = ['name', 'email', 'role', 'actions'];
  users: User[] = [];
  reviews: Array<{
    id: number;
    rating: number;
    comment: string;
    event_title: string;
    user: User;
  }> = [];

  ngOnInit(): void {
    this.reload();
  }

  reload(): void {
    this.admin.users().subscribe((r) => (this.users = r.users));
    this.admin.reportedReviews().subscribe((r) => (this.reviews = r.reviews));
  }

  promote(u: User, role: UserRole): void {
    this.admin.updateUser(u.id, { role }).subscribe(() => {
      this.snack.open('Ruolo aggiornato', 'OK');
      this.reload();
    });
  }

  ban(u: User, is_banned: boolean): void {
    this.admin.updateUser(u.id, { is_banned }).subscribe(() => this.reload());
  }

  moderate(id: number, action: 'hide' | 'dismiss'): void {
    this.admin.moderateReview(id, action).subscribe(() => this.reload());
  }
}
