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
    <section class="grid min-h-[calc(100vh-8rem)] items-center gap-8 lg:grid-cols-[1fr_500px]">
      <div class="hidden max-w-xl lg:block">
        <p class="text-sm font-semibold uppercase tracking-[0.18em] text-brand-700">Get Started</p>
        <h1 class="mt-4 text-4xl font-bold tracking-tight text-slate-950">Create a workspace-ready booking account.</h1>
        <p class="mt-4 text-base leading-7 text-slate-600">
          Register as a client or administrator and keep appointment activity organized from day one.
        </p>
      </div>

      <div class="surface mx-auto w-full max-w-lg p-7">
      <p class="mb-2 text-sm font-semibold text-brand-700">New account</p>
      <h2 class="text-2xl font-bold tracking-tight text-slate-950">Create Account</h2>
      <p class="mt-2 text-sm text-slate-500">Register to start booking appointments.</p>

      <form class="mt-6 space-y-4" [formGroup]="form" (ngSubmit)="submit()">
        <div>
          <label class="field-label">Full Name</label>
          <input formControlName="name" class="field" type="text" autocomplete="name" />
        </div>
        <div>
          <label class="field-label">Email</label>
          <input formControlName="email" class="field" type="email" autocomplete="email" />
        </div>
        <div>
          <label class="field-label">Password</label>
          <input formControlName="password" class="field" type="password" autocomplete="new-password" />
        </div>
        <div>
          <label class="field-label">Role</label>
          <select formControlName="role" class="field">
            <option value="user">User</option>
            <option value="admin">Admin</option>
          </select>
        </div>

        <p *ngIf="error" class="rounded-md border border-red-100 bg-red-50 p-3 text-sm text-red-700">{{ error }}</p>

        <button
          class="btn-primary w-full"
          [disabled]="form.invalid || loading"
        >
          {{ loading ? "Creating..." : "Register" }}
        </button>
      </form>

      <p class="mt-5 text-center text-sm text-slate-600">
        Already have an account?
        <a routerLink="/login" class="font-semibold text-brand-700 hover:text-brand-900">Login</a>
      </p>
      </div>
    </section>
  `
})
export class RegisterComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  loading = false;
  error = "";
  form = this.fb.nonNullable.group({
    name: ["", [Validators.required, Validators.minLength(2)]],
    email: ["", [Validators.required, Validators.email]],
    password: ["", [Validators.required, Validators.minLength(6)]],
    role: ["user" as "admin" | "user", [Validators.required]]
  });

  submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.error = "";
    this.loading = true;
    this.auth
      .register(this.form.getRawValue())
      .pipe(
        catchError((err) => {
          this.error = this.resolveErrorMessage(err, "Registration failed.");
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
      return "The live backend is still waking up on Render. Please wait a moment and try registering again.";
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
