import { Routes } from "@angular/router";
import { authGuard } from "./guards/auth.guard";
import { roleGuard } from "./guards/role.guard";
import { LoginComponent } from "./pages/login.component";
import { RegisterComponent } from "./pages/register.component";
import { AppointmentsComponent } from "./pages/appointments.component";

export const appRoutes: Routes = [
  { path: "", pathMatch: "full", redirectTo: "appointments" },
  { path: "login", component: LoginComponent },
  { path: "register", component: RegisterComponent },
  {
    path: "appointments",
    component: AppointmentsComponent,
    canActivate: [authGuard]
  },
  {
    path: "admin",
    component: AppointmentsComponent,
    canActivate: [authGuard, roleGuard],
    data: { role: "admin" }
  },
  { path: "**", redirectTo: "appointments" }
];
