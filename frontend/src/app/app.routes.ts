import { Routes } from '@angular/router';
import { ShellComponent } from './layout/shell/shell.component';
import { authGuard, roleGuard } from './core/auth.guard';

export const routes: Routes = [
  {
    path: '',
    component: ShellComponent,
    children: [
      { path: '', loadComponent: () => import('./pages/home/home.component').then((m) => m.HomeComponent) },
      { path: 'events', loadComponent: () => import('./pages/events/events-list.component').then((m) => m.EventsListComponent) },
      { path: 'events/:id', loadComponent: () => import('./pages/events/event-detail.component').then((m) => m.EventDetailComponent) },
      {
        path: 'auth',
        children: [
          { path: 'login', loadComponent: () => import('./pages/auth/login.component').then((m) => m.LoginComponent) },
          { path: 'register', loadComponent: () => import('./pages/auth/register.component').then((m) => m.RegisterComponent) },
        ],
      },
      {
        path: 'account',
        canActivate: [authGuard],
        children: [
          { path: 'tickets', loadComponent: () => import('./pages/account/tickets.component').then((m) => m.TicketsComponent) },
          { path: 'profile', loadComponent: () => import('./pages/account/profile.component').then((m) => m.ProfileComponent) },
        ],
      },
      {
        path: 'organizer',
        canActivate: [roleGuard('organizer', 'admin')],
        children: [
          { path: '', loadComponent: () => import('./pages/organizer/dashboard.component').then((m) => m.OrganizerDashboardComponent) },
          { path: 'events', loadComponent: () => import('./pages/organizer/events-manage.component').then((m) => m.EventsManageComponent) },
        ],
      },
      {
        path: 'admin',
        canActivate: [roleGuard('admin')],
        loadComponent: () => import('./pages/admin/admin.component').then((m) => m.AdminComponent),
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
