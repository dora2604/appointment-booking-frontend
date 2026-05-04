import { CommonModule, DatePipe } from "@angular/common";
import { Component, OnInit, inject } from "@angular/core";
import { FormBuilder, ReactiveFormsModule, Validators } from "@angular/forms";
import { catchError, finalize, throwError } from "rxjs";

import { Appointment, AppointmentStatus } from "../models/appointment.model";
import { AppointmentService, AppointmentSummary } from "../services/appointment.service";
import { ApiService } from "../services/api.service";
import { AuthService } from "../services/auth.service";

@Component({
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, DatePipe],
  template: `
    <section class="space-y-6">
      <div *ngIf="isAdmin && summary" class="grid gap-3 md:grid-cols-5">
        <div class="rounded-lg bg-white p-4 shadow-soft">
          <p class="text-xs uppercase text-slate-500">Total</p>
          <p class="text-2xl font-bold text-slate-800">{{ summary.total }}</p>
        </div>
        <div class="rounded-lg bg-white p-4 shadow-soft">
          <p class="text-xs uppercase text-slate-500">Pending</p>
          <p class="text-2xl font-bold text-amber-600">{{ summary.pending }}</p>
        </div>
        <div class="rounded-lg bg-white p-4 shadow-soft">
          <p class="text-xs uppercase text-slate-500">Confirmed</p>
          <p class="text-2xl font-bold text-brand-700">{{ summary.confirmed }}</p>
        </div>
        <div class="rounded-lg bg-white p-4 shadow-soft">
          <p class="text-xs uppercase text-slate-500">Completed</p>
          <p class="text-2xl font-bold text-emerald-600">{{ summary.completed }}</p>
        </div>
        <div class="rounded-lg bg-white p-4 shadow-soft">
          <p class="text-xs uppercase text-slate-500">Cancelled</p>
          <p class="text-2xl font-bold text-red-600">{{ summary.cancelled }}</p>
        </div>
      </div>

      <div class="rounded-xl bg-white p-5 shadow-soft">
        <div class="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 class="text-2xl font-bold text-slate-800">
              {{ editingAppointment ? "Edit Appointment" : "Book Appointment" }}
            </h1>
            <p class="mt-1 text-sm text-slate-500">
              {{ editingAppointment ? "Update appointment details and attachment." : "Create and manage your appointment schedule." }}
            </p>
          </div>
          <button
            *ngIf="editingAppointment"
            type="button"
            class="rounded-lg border px-3 py-2 text-sm text-slate-600 hover:bg-slate-50"
            (click)="cancelEdit()"
          >
            Cancel Edit
          </button>
        </div>

        <form class="mt-4 grid gap-3 md:grid-cols-2" [formGroup]="form" (ngSubmit)="save()">
          <label class="space-y-1">
            <span class="text-sm text-slate-600">Full Name</span>
            <input class="w-full rounded-lg border p-2" formControlName="fullName" />
          </label>
          <label class="space-y-1">
            <span class="text-sm text-slate-600">Email</span>
            <input class="w-full rounded-lg border p-2" type="email" formControlName="email" />
          </label>
          <label class="space-y-1">
            <span class="text-sm text-slate-600">Phone Number</span>
            <input class="w-full rounded-lg border p-2" formControlName="phone" />
          </label>
          <label class="space-y-1">
            <span class="text-sm text-slate-600">Service</span>
            <select class="w-full rounded-lg border p-2" formControlName="serviceType">
              <option value="">Select service</option>
              <option value="consultation">Consultation</option>
              <option value="follow_up">Follow Up</option>
              <option value="therapy">Therapy</option>
              <option value="dental">Dental</option>
            </select>
          </label>
          <label class="space-y-1">
            <span class="text-sm text-slate-600">Appointment Date</span>
            <input class="w-full rounded-lg border p-2" type="datetime-local" formControlName="appointmentDate" />
          </label>
          <label class="space-y-1">
            <span class="text-sm text-slate-600">Attachment</span>
            <input
              class="w-full rounded-lg border p-2"
              type="file"
              accept=".png,.jpg,.jpeg,.pdf"
              [disabled]="uploading"
              (change)="onFile($event)"
            />
          </label>
          <textarea
            class="rounded-lg border p-2 md:col-span-2"
            rows="3"
            placeholder="Notes (optional)"
            formControlName="notes"
          ></textarea>

          <div class="flex flex-wrap items-center gap-3 md:col-span-2">
            <button
              class="rounded-lg bg-brand-500 px-4 py-2 font-medium text-white hover:bg-brand-700 disabled:opacity-60"
              [disabled]="form.invalid || submitting || uploading"
            >
              {{ submitting ? "Saving..." : editingAppointment ? "Update Appointment" : "Create Appointment" }}
            </button>
            <p *ngIf="uploading" class="text-sm text-slate-500">Uploading attachment...</p>
            <a
              *ngIf="uploadedFileUrl"
              class="text-sm text-brand-700 underline"
              [href]="serverFileUrl(uploadedFileUrl)"
              target="_blank"
            >
              Attachment ready
            </a>
          </div>
        </form>
      </div>

      <div class="rounded-xl bg-white p-5 shadow-soft">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <h2 class="text-lg font-semibold text-slate-800">
            {{ isAdmin ? "All Appointments" : "My Appointments" }}
          </h2>
          <p class="text-sm text-slate-500">{{ totalItems }} record{{ totalItems === 1 ? "" : "s" }}</p>
        </div>

        <div class="mt-4 grid gap-2 md:grid-cols-6" [formGroup]="filterForm">
          <input class="rounded-lg border p-2 md:col-span-2" placeholder="Search name/email/phone" formControlName="search" />
          <select class="rounded-lg border p-2" formControlName="status">
            <option value="">All status</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="cancelled">Cancelled</option>
            <option value="completed">Completed</option>
          </select>
          <select class="rounded-lg border p-2" formControlName="serviceType">
            <option value="">All services</option>
            <option value="consultation">Consultation</option>
            <option value="follow_up">Follow Up</option>
            <option value="therapy">Therapy</option>
            <option value="dental">Dental</option>
          </select>
          <input class="rounded-lg border p-2" type="date" formControlName="from" />
          <input class="rounded-lg border p-2" type="date" formControlName="to" />
        </div>

        <div class="mt-3 flex flex-wrap gap-2">
          <button class="rounded-lg border border-brand-500 px-3 py-2 text-brand-700" (click)="load(1)">
            Apply Filters
          </button>
          <button class="rounded-lg border px-3 py-2 text-slate-600" (click)="clearFilters()">
            Clear
          </button>
        </div>

        <p *ngIf="success" class="mt-3 rounded bg-emerald-50 p-2 text-sm text-emerald-700">{{ success }}</p>
        <p *ngIf="error" class="mt-3 rounded bg-red-50 p-2 text-sm text-red-600">{{ error }}</p>
        <p *ngIf="loading" class="mt-3 text-sm text-slate-500">Loading appointments...</p>

        <div class="mt-4 overflow-x-auto">
          <table class="min-w-full text-sm">
            <thead>
              <tr class="border-b bg-slate-50 text-left text-slate-600">
                <th class="p-2">Client</th>
                <th class="p-2">Service</th>
                <th class="p-2">Schedule</th>
                <th class="p-2">Status</th>
                <th class="p-2">Notes</th>
                <th class="p-2">Attachment</th>
                <th class="p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let item of appointments" class="border-b align-top">
                <td class="p-2">
                  <p class="font-medium text-slate-800">{{ item.fullName }}</p>
                  <p class="text-xs text-slate-500">{{ item.email }}</p>
                  <p class="text-xs text-slate-500">{{ item.phone }}</p>
                </td>
                <td class="p-2 capitalize">{{ item.serviceType.replace("_", " ") }}</td>
                <td class="p-2">{{ item.appointmentDate | date: "medium" }}</td>
                <td class="p-2">
                  <ng-container *ngIf="isAdmin; else userStatus">
                    <select
                      class="rounded border p-1"
                      [value]="item.status"
                      (change)="changeStatus(item, $any($event.target).value)"
                    >
                      <option value="pending">Pending</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="cancelled">Cancelled</option>
                      <option value="completed">Completed</option>
                    </select>
                  </ng-container>
                  <ng-template #userStatus>
                    <span class="rounded-full bg-slate-100 px-2 py-1 text-xs capitalize text-slate-700">
                      {{ item.status }}
                    </span>
                  </ng-template>
                </td>
                <td class="max-w-xs p-2 text-slate-600">{{ item.notes || "-" }}</td>
                <td class="p-2">
                  <a
                    *ngIf="item.attachmentUrl"
                    class="text-brand-700 underline"
                    [href]="serverFileUrl(item.attachmentUrl)"
                    target="_blank"
                  >
                    View
                  </a>
                  <span *ngIf="!item.attachmentUrl">-</span>
                </td>
                <td class="space-x-3 p-2">
                  <button class="text-brand-700 underline" (click)="startEdit(item)">Edit</button>
                  <button class="text-red-600 underline" (click)="remove(item)">Delete</button>
                </td>
              </tr>
              <tr *ngIf="!loading && appointments.length === 0">
                <td colspan="7" class="p-4 text-center text-slate-500">No appointments found.</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="mt-4 flex items-center justify-between">
          <p class="text-sm text-slate-500">Page {{ page }} of {{ totalPages }}</p>
          <div class="flex gap-2">
            <button class="rounded border px-3 py-1" [disabled]="page <= 1" (click)="load(page - 1)">
              Prev
            </button>
            <button
              class="rounded border px-3 py-1"
              [disabled]="page >= totalPages"
              (click)="load(page + 1)"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </section>
  `
})
export class AppointmentsComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly appointmentService = inject(AppointmentService);
  private readonly api = inject(ApiService);
  private readonly auth = inject(AuthService);

  appointments: Appointment[] = [];
  page = 1;
  totalPages = 1;
  totalItems = 0;
  loading = false;
  submitting = false;
  uploading = false;
  error = "";
  success = "";
  uploadedFileUrl = "";
  summary: AppointmentSummary | null = null;
  editingAppointment: Appointment | null = null;

  get isAdmin(): boolean {
    return this.auth.currentUser?.role === "admin";
  }

  form = this.fb.nonNullable.group({
    fullName: ["", [Validators.required, Validators.minLength(2)]],
    email: ["", [Validators.required, Validators.email]],
    phone: ["", [Validators.required, Validators.minLength(7)]],
    serviceType: ["", [Validators.required]],
    appointmentDate: ["", [Validators.required]],
    notes: [""]
  });

  filterForm = this.fb.nonNullable.group({
    search: [""],
    status: [""],
    serviceType: [""],
    from: [""],
    to: [""]
  });

  ngOnInit(): void {
    this.prefillCurrentUser();
    this.load(1);
    this.loadSummary();
  }

  load(page: number) {
    this.page = page;
    this.error = "";
    this.loading = true;
    const values = this.filterForm.getRawValue();
    this.appointmentService
      .list({
        page,
        limit: 8,
        search: values.search,
        status: values.status,
        serviceType: values.serviceType,
        from: values.from,
        to: values.to,
        sortBy: "appointmentDate",
        order: "asc"
      })
      .pipe(
        catchError((err) => {
          this.error = err?.status === 0 ? this.serverErrorMessage : err?.error?.message ?? "Failed to load appointments.";
          return throwError(() => err);
        }),
        finalize(() => {
          this.loading = false;
        })
      )
      .subscribe((response) => {
        this.appointments = response.items;
        this.totalItems = response.pagination.total;
        this.totalPages = Math.max(response.pagination.totalPages, 1);
        this.loadSummary();
      });
  }

  loadSummary() {
    if (!this.isAdmin) {
      return;
    }
    this.appointmentService.summary().subscribe({
      next: (summary) => {
        this.summary = summary;
      },
      error: () => {
        this.summary = null;
      }
    });
  }

  save() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting = true;
    this.clearMessages();
    const payload = this.formPayload();
    const wasEditing = !!this.editingAppointment;
    const request = this.editingAppointment
      ? this.appointmentService.update(this.editingAppointment._id, payload)
      : this.appointmentService.create(payload);

    request
      .pipe(
        catchError((err) => {
          this.error = err?.status === 0 ? this.serverErrorMessage : err?.error?.message ?? "Appointment save failed.";
          return throwError(() => err);
        }),
        finalize(() => {
          this.submitting = false;
        })
      )
      .subscribe(() => {
        this.success = wasEditing ? "Appointment updated successfully." : "Appointment created successfully.";
        this.resetForm();
        this.load(wasEditing ? this.page : 1);
      });
  }

  startEdit(item: Appointment) {
    this.clearMessages();
    this.editingAppointment = item;
    this.uploadedFileUrl = item.attachmentUrl ?? "";
    this.form.patchValue({
      fullName: item.fullName,
      email: item.email,
      phone: item.phone,
      serviceType: item.serviceType,
      appointmentDate: this.toDateTimeLocal(item.appointmentDate),
      notes: item.notes ?? ""
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  cancelEdit() {
    this.resetForm();
    this.prefillCurrentUser();
  }

  clearFilters() {
    this.filterForm.reset();
    this.load(1);
  }

  onFile(event: Event) {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];
    if (!file) {
      return;
    }

    this.clearMessages();
    this.uploading = true;
    this.appointmentService
      .upload(file)
      .pipe(
        finalize(() => {
          this.uploading = false;
        })
      )
      .subscribe({
        next: (response) => {
          this.uploadedFileUrl = response.file.url;
          this.success = "Attachment uploaded successfully.";
        },
        error: (err) => {
          this.error = err?.status === 0 ? this.serverErrorMessage : err?.error?.message ?? "Upload failed.";
        }
      });
  }

  remove(item: Appointment) {
    const confirmed = window.confirm(`Delete appointment for ${item.fullName}?`);
    if (!confirmed) {
      return;
    }

    this.clearMessages();
    this.appointmentService.remove(item._id).subscribe({
      next: () => {
        this.success = "Appointment deleted successfully.";
        this.load(this.page);
      },
      error: (err) => {
        this.error = err?.status === 0 ? this.serverErrorMessage : err?.error?.message ?? "Delete failed.";
      }
    });
  }

  changeStatus(item: Appointment, status: AppointmentStatus) {
    this.clearMessages();
    this.appointmentService.update(item._id, { status }).subscribe({
      next: () => {
        this.success = "Status updated successfully.";
        this.load(this.page);
      },
      error: (err) => {
        this.error = err?.status === 0 ? this.serverErrorMessage : err?.error?.message ?? "Status update failed.";
      }
    });
  }

  serverFileUrl(relativePath: string): string {
    return `${this.api.baseUrl.replace(/\/api$/, "")}${relativePath}`;
  }

  private formPayload(): Partial<Appointment> {
    const raw = this.form.getRawValue();
    return {
      fullName: raw.fullName,
      email: raw.email,
      phone: raw.phone,
      serviceType: raw.serviceType as Appointment["serviceType"],
      appointmentDate: new Date(raw.appointmentDate).toISOString(),
      notes: raw.notes,
      attachmentUrl: this.uploadedFileUrl
    };
  }

  private resetForm() {
    this.form.reset();
    this.uploadedFileUrl = "";
    this.editingAppointment = null;
  }

  private prefillCurrentUser() {
    const user = this.auth.currentUser;
    if (!user) {
      return;
    }
    this.form.patchValue({
      fullName: user.name,
      email: user.email
    });
  }

  private toDateTimeLocal(value: string): string {
    const date = new Date(value);
    const offset = date.getTimezoneOffset() * 60000;
    return new Date(date.getTime() - offset).toISOString().slice(0, 16);
  }

  private clearMessages() {
    this.error = "";
    this.success = "";
  }

  private get serverErrorMessage(): string {
    return "Cannot connect to the server. Please make sure the backend is running.";
  }
}
