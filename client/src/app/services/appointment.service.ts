import { HttpClient, HttpParams } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { BehaviorSubject, Observable, finalize, tap } from "rxjs";

import { ApiService } from "./api.service";
import { Appointment, AppointmentListResponse } from "../models/appointment.model";

export interface AppointmentQuery {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  serviceType?: string;
  from?: string;
  to?: string;
  sortBy?: string;
  order?: "asc" | "desc";
}

export interface AppointmentSummary {
  total: number;
  pending: number;
  confirmed: number;
  cancelled: number;
  completed: number;
}

@Injectable({ providedIn: "root" })
export class AppointmentService {
  private itemsSubject = new BehaviorSubject<Appointment[]>([]);
  readonly items$ = this.itemsSubject.asObservable();

  private loadingSubject = new BehaviorSubject<boolean>(false);
  readonly loading$ = this.loadingSubject.asObservable();

  constructor(
    private readonly http: HttpClient,
    private readonly api: ApiService
  ) {}

  list(query: AppointmentQuery): Observable<AppointmentListResponse> {
    let params = new HttpParams();
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== "") {
        params = params.set(key, String(value));
      }
    });

    this.loadingSubject.next(true);
    return this.http
      .get<AppointmentListResponse>(`${this.api.baseUrl}/appointments`, { params })
      .pipe(
        tap((response) => this.itemsSubject.next(response.items)),
        finalize(() => this.loadingSubject.next(false))
      );
  }

  create(payload: Partial<Appointment>): Observable<{ message: string; appointment: Appointment }> {
    return this.http.post<{ message: string; appointment: Appointment }>(
      `${this.api.baseUrl}/appointments`,
      payload
    );
  }

  update(
    id: string,
    payload: Partial<Appointment>
  ): Observable<{ message: string; appointment: Appointment }> {
    return this.http.put<{ message: string; appointment: Appointment }>(
      `${this.api.baseUrl}/appointments/${id}`,
      payload
    );
  }

  remove(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.api.baseUrl}/appointments/${id}`);
  }

  summary(): Observable<AppointmentSummary> {
    return this.http.get<AppointmentSummary>(`${this.api.baseUrl}/appointments/admin/summary`);
  }

  upload(file: File): Observable<{ file: { url: string } }> {
    const formData = new FormData();
    formData.append("file", file);
    return this.http.post<{ file: { url: string } }>(`${this.api.baseUrl}/uploads`, formData);
  }
}
