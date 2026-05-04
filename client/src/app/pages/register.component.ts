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
    <section class="mx-auto max-w-md rounded-xl bg-white p-6 shadow-soft">
      <h1 class="mb-1 text-2xl font-bold text-slate-800">Create Account</h1>
      <p class="mb-6 text-sm text-slate-500">Register to start booking appointments.</p>

      <form class="space-y-4" [formGroup]="form" (ngSubmit)="submit()">
        <div>
          <label class="mb-1 block text-sm text-slate-600">Full Name</label>
          <input formControlName="name" class="w-full rounded-lg border p-2" type="text" />
        </div>
        <div>
          <label class="mb-1 block text-sm text-slate-600">Email</label>
          <input formControlName="email" class="w-full rounded-lg border p-2" type="email" />
        </div>
        <div>
          <label class="mb-1 block text-sm text-slate-600">Password</label>
          <input formControlName="password" class="w-full rounded-lg border p-2" type="password" />
        </div>
        <div>
          <label class="mb-1 block text-sm text-slate-600">Role</label>
          <select formControlName="role" class="w-full rounded-lg border p-2">
            <option value="user">User</option>
            <option value="admin">Admin</option>
          </select>
        </div>

        <p *ngIf="error" class="rounded bg-red-50 p-2 text-sm text-red-600">{{ error }}</p>

        <button
          class="w-full rounded-lg bg-brand-500 p-2 font-medium text-white hover:bg-brand-700 disabled:opacity-60"
          [disabled]="form.invalid || loading"
        >
          {{ loading ? "Creating..." : "Register" }}
        </button>
      </form>

      <p class="mt-4 text-sm text-slate-600">
        Already have an account?
        <a routerLink="/login" class="text-brand-700 underline">Login</a>
      </p>
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
          this.error =
            err?.status === 0
              ? "Cannot connect to the server. Please make sure the backend and database are running."
              : err?.error?.message ?? "Registration failed.";
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
}
