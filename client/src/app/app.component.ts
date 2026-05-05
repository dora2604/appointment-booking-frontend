import { CommonModule } from "@angular/common";
import { Component, inject } from "@angular/core";
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from "@angular/router";
import { AuthService } from "./services/auth.service";

@Component({
  selector: "app-root",
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-brand-50 via-white to-slate-100">
      <header class="border-b border-slate-200 bg-white/90 backdrop-blur-sm">
        <nav class="mx-auto flex max-w-6xl items-center justify-between p-4">
          <a routerLink="/" class="text-lg font-semibold text-brand-700">Appointment Booking</a>
          <div class="flex items-center gap-3 text-sm">
            <a
              routerLink="/appointments"
              routerLinkActive="text-brand-700 bg-brand-50"
              [routerLinkActiveOptions]="{ exact: true }"
              class="rounded px-3 py-2 text-slate-600 transition-colors duration-150 hover:bg-brand-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-500"
              >Appointments</a
            >
            <a
              *ngIf="auth.currentUser?.role === 'admin'"
              routerLink="/admin"
              routerLinkActive="text-brand-700 bg-brand-50"
              [routerLinkActiveOptions]="{ exact: true }"
              class="rounded px-3 py-2 text-slate-600 transition-colors duration-150 hover:bg-brand-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-500"
              >Admin</a
            >
            <a
              *ngIf="!auth.isLoggedIn"
              routerLink="/login"
              routerLinkActive="text-brand-700 bg-brand-50"
              [routerLinkActiveOptions]="{ exact: true }"
              class="rounded px-3 py-2 text-slate-600 transition-colors duration-150 hover:bg-brand-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-500"
              >Login</a
            >
            <a
              *ngIf="!auth.isLoggedIn"
              routerLink="/register"
              routerLinkActive="text-brand-700 bg-brand-50"
              [routerLinkActiveOptions]="{ exact: true }"
              class="rounded px-3 py-2 text-slate-600 transition-colors duration-150 hover:bg-brand-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-500"
              >Register</a
            >
            <button
              *ngIf="auth.isLoggedIn"
              type="button"
              class="rounded bg-brand-500 px-3 py-2 text-white transition hover:bg-brand-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-500"
              (click)="logout()"
            >
              Logout
            </button>
          </div>
        </nav>
      </header>

      <main class="mx-auto max-w-6xl p-4">
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
