import { CommonModule } from "@angular/common";
import { Component, inject } from "@angular/core";
import { FormBuilder, ReactiveFormsModule, Validators } from "@angular/forms";
import { Router, RouterLink } from "@angular/router";
import { catchError, finalize, throwError } from "rxjs";
import { AuthService } from "../services/auth.service";

@Component({
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <section class="grid min-h-[calc(100vh-8rem)] items-center gap-8 lg:grid-cols-[1fr_460px]">
      <div class="hidden max-w-xl lg:block">
        <p class="text-sm font-semibold uppercase tracking-[0.18em] text-brand-700">Client Scheduling</p>
        <h1 class="mt-4 text-4xl font-bold tracking-tight text-slate-950">Manage bookings with a calmer workflow.</h1>
        <p class="mt-4 text-base leading-7 text-slate-600">
          Track appointments, service requests, attachments, and status updates from one clean workspace.
        </p>
        <div class="mt-8 grid grid-cols-3 gap-3">
          <div class="metric-card">
            <p class="text-2xl font-bold text-brand-700">24/7</p>
            <p class="mt-1 text-xs font-medium text-slate-500">Online booking</p>
          </div>
          <div class="metric-card">
            <p class="text-2xl font-bold text-slate-900">Fast</p>
            <p class="mt-1 text-xs font-medium text-slate-500">Status updates</p>
          </div>
          <div class="metric-card">
            <p class="text-2xl font-bold text-accent-700">Secure</p>
            <p class="mt-1 text-xs font-medium text-slate-500">Account access</p>
          </div>
        </div>
      </div>

      <div class="surface mx-auto w-full max-w-md p-7">
        <p class="mb-2 text-sm font-semibold text-brand-700">Welcome back</p>
        <h2 class="text-2xl font-bold tracking-tight text-slate-950">Login to your account</h2>
        <p class="mt-2 text-sm text-slate-500">Access your account to manage appointments.</p>

      <form class="mt-6 space-y-4" [formGroup]="form" (ngSubmit)="submit()">
        <div>
          <label class="field-label">Email</label>
          <input formControlName="email" class="field" type="email" autocomplete="email" />
        </div>
        <div>
          <label class="field-label">Password</label>
          <input formControlName="password" class="field" type="password" autocomplete="current-password" />
        </div>

        <p *ngIf="error" class="rounded-md border border-red-100 bg-red-50 p-3 text-sm text-red-700">{{ error }}</p>

        <button
          class="btn-primary w-full"
          [disabled]="form.invalid || loading"
        >
          {{ loading ? "Logging in..." : "Login" }}
        </button>
      </form>

      <p class="mt-5 text-center text-sm text-slate-600">
        No account yet?
        <a routerLink="/register" class="font-semibold text-brand-700 hover:text-brand-900">Register</a>
      </p>
      </div>
    </section>
  `
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  loading = false;
  error = "";
  form = this.fb.nonNullable.group({
    email: ["", [Validators.required, Validators.email]],
    password: ["", [Validators.required, Validators.minLength(6)]]
  });

  submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.error = "";
    this.loading = true;
    this.auth
      .login(this.form.getRawValue())
      .pipe(
        catchError((err) => {
          this.error = this.resolveErrorMessage(err, "Login failed.");
          return throwError(() => err);
        }),
        finalize(() => {
          this.loading = false;
        })
      )
      .subscribe(() => {
        this.router.navigateByUrl("/appointments");
      });
  }

  private resolveErrorMessage(err: unknown, fallback: string): string {
    const httpError = err as {
      status?: number;
      error?: { message?: string } | string;
      message?: string;
      statusText?: string;
    };

    if (httpError?.status === 0) {
      return "Cannot connect to the server. Please make sure the backend and database are running.";
    }
    if (httpError?.message?.includes("Timeout")) {
      return "The live backend is still waking up on Render. Please wait a moment and try logging in again.";
    }
    if (typeof httpError?.error === "string" && httpError.error.trim()) {
      return httpError.error;
    }
    if (httpError?.error && typeof httpError.error === "object" && "message" in httpError.error) {
      return httpError.error.message || fallback;
    }
    return httpError?.message || httpError?.statusText || fallback;
  }
}
