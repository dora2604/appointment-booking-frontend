import { CommonModule } from "@angular/common";
import { Component, inject } from "@angular/core";
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from "@angular/router";
import { AuthService } from "./services/auth.service";

@Component({
  selector: "app-root",
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="app-shell">
      <header class="topbar">
        <nav class="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <a routerLink="/" class="flex items-center gap-3">
            <span class="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-700 text-sm font-bold text-white shadow-sm">
              AB
            </span>
            <span>
              <span class="block text-base font-bold tracking-tight text-slate-950">Appointment Booking</span>
              <span class="hidden text-xs font-medium text-slate-500 sm:block">Scheduling workspace</span>
            </span>
          </a>
          <div class="flex items-center gap-2 text-sm">
            <a
              routerLink="/appointments"
              routerLinkActive="nav-link-active"
              [routerLinkActiveOptions]="{ exact: true }"
              class="nav-link"
              >Appointments</a
            >
            <a
              *ngIf="auth.currentUser?.role === 'admin'"
              routerLink="/admin"
              routerLinkActive="nav-link-active"
              [routerLinkActiveOptions]="{ exact: true }"
              class="nav-link"
              >Admin</a
            >
            <a
              *ngIf="!auth.isLoggedIn"
              routerLink="/login"
              routerLinkActive="nav-link-active"
              [routerLinkActiveOptions]="{ exact: true }"
              class="nav-link"
              >Login</a
            >
            <a
              *ngIf="!auth.isLoggedIn"
              routerLink="/register"
              routerLinkActive="nav-link-active"
              [routerLinkActiveOptions]="{ exact: true }"
              class="nav-link"
              >Register</a
            >
            <button
              *ngIf="auth.isLoggedIn"
              type="button"
              class="btn-primary px-3 py-2"
              (click)="logout()"
            >
              Logout
            </button>
          </div>
        </nav>
      </header>

      <main class="page-wrap">
        <router-outlet></router-outlet>
      </main>
    </div>
  `
})
export class AppComponent {
  public readonly router = inject(Router);

  constructor(public readonly auth: AuthService) {}

  logout() {
    this.auth.logout();
    this.router.navigateByUrl("/login");
  }
}
