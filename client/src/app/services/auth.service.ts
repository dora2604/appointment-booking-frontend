import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { BehaviorSubject, Observable, tap } from "rxjs";

import { ApiService } from "./api.service";
import { AuthResponse, User } from "../models/auth.model";

interface Credentials {
  email: string;
  password: string;
}

interface RegisterInput extends Credentials {
  name: string;
  role?: "admin" | "user";
}

@Injectable({ providedIn: "root" })
export class AuthService {
  private userSubject = new BehaviorSubject<User | null>(this.getStoredUser());
  readonly user$ = this.userSubject.asObservable();

  constructor(
    private readonly http: HttpClient,
    private readonly api: ApiService
  ) {}

  get token(): string | null {
    return localStorage.getItem("token");
  }

  get currentUser(): User | null {
    return this.userSubject.value;
  }

  get isLoggedIn(): boolean {
    return !!this.token;
  }

  register(payload: RegisterInput): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.api.baseUrl}/auth/register`, payload)
      .pipe(tap((response) => this.persistAuth(response)));
  }

  login(payload: Credentials): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.api.baseUrl}/auth/login`, payload)
      .pipe(tap((response) => this.persistAuth(response)));
  }

  logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    this.userSubject.next(null);
  }

  private persistAuth(response: AuthResponse) {
    localStorage.setItem("token", response.token);
    localStorage.setItem("user", JSON.stringify(response.user));
    this.userSubject.next(response.user);
  }

  private getStoredUser(): User | null {
    const raw = localStorage.getItem("user");
    return raw ? (JSON.parse(raw) as User) : null;
  }
}
