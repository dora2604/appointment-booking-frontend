import { createClient, SupabaseClient } from "@supabase/supabase-js";

import { env } from "../config/env";
import {
  AppointmentListOptions,
  AppointmentRecord,
  AppointmentStatus,
  ServiceType,
  UserRecord,
  UserRole
} from "../types/data";
import { ApiError } from "../utils/ApiError";

type UserRow = {
  id: string;
  name: string;
  email: string;
  password: string;
  role: UserRole;
  created_at: string;
  updated_at: string;
};

type AppointmentRow = {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  phone: string;
  service_type: ServiceType;
  appointment_date: string;
  notes: string | null;
  status: AppointmentStatus;
  attachment_url: string | null;
  created_at: string;
  updated_at: string;
};

let supabaseAdmin: SupabaseClient | null = null;

const getSupabaseAdmin = () => {
  if (!supabaseAdmin) {
    supabaseAdmin = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    });
  }

  return supabaseAdmin;
};

const mapUserRow = (row: UserRow): UserRecord => ({
  _id: row.id,
  name: row.name,
  email: row.email,
  password: row.password,
  role: row.role,
  createdAt: row.created_at,
  updatedAt: row.updated_at
});

const mapAppointmentRow = (row: AppointmentRow): AppointmentRecord => ({
  _id: row.id,
  userId: row.user_id,
  fullName: row.full_name,
  email: row.email,
  phone: row.phone,
  serviceType: row.service_type,
  appointmentDate: row.appointment_date,
  notes: row.notes ?? undefined,
  status: row.status,
  attachmentUrl: row.attachment_url ?? undefined,
  createdAt: row.created_at,
  updatedAt: row.updated_at
});

const escapeLike = (value: string) => value.replace(/[%_,]/g, (match) => `\\${match}`);

const sortColumns: Record<string, string> = {
  appointmentDate: "appointment_date",
  createdAt: "created_at",
  updatedAt: "updated_at",
  status: "status",
  serviceType: "service_type",
  fullName: "full_name"
};

const normalizeAppointmentPayload = (payload: Partial<AppointmentRecord>) => {
  const nextPayload: Record<string, string | undefined> = {};

  if (payload.fullName !== undefined) nextPayload.full_name = payload.fullName;
  if (payload.email !== undefined) nextPayload.email = payload.email.toLowerCase();
  if (payload.phone !== undefined) nextPayload.phone = payload.phone;
  if (payload.serviceType !== undefined) nextPayload.service_type = payload.serviceType;
  if (payload.appointmentDate !== undefined) {
    nextPayload.appointment_date = new Date(payload.appointmentDate).toISOString();
  }
  if (payload.notes !== undefined) nextPayload.notes = payload.notes;
  if (payload.status !== undefined) nextPayload.status = payload.status;
  if (payload.attachmentUrl !== undefined) nextPayload.attachment_url = payload.attachmentUrl;

  return nextPayload;
};

const throwQueryError = (message: string, error: unknown): never => {
  const details =
    error && typeof error === "object" && "message" in error && typeof error.message === "string"
      ? error.message
      : "Unknown Supabase error.";
  throw new ApiError(503, `${message}: ${details}`);
};

export const supabaseStore = {
  async ping() {
    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from("users").select("id", { count: "exact", head: true });
    if (error) {
      throw error;
    }
  },

  async findUserByEmail(email: string) {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("email", email.toLowerCase())
      .maybeSingle<UserRow>();

    if (error) {
      throwQueryError("Failed to load user", error);
    }

    return data ? mapUserRow(data) : null;
  },

  async createUser(input: Pick<UserRecord, "name" | "email" | "password" | "role">) {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("users")
      .insert({
        name: input.name,
        email: input.email.toLowerCase(),
        password: input.password,
        role: input.role
      })
      .select("*")
      .single<UserRow>();

    if (error) {
      throwQueryError("Failed to create user", error);
    }
    if (!data) {
      throw new ApiError(503, "Failed to create user: no data returned.");
    }

    return mapUserRow(data);
  },

  async createAppointment(input: Omit<AppointmentRecord, "_id" | "createdAt" | "updatedAt">) {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("appointments")
      .insert({
        user_id: input.userId,
        full_name: input.fullName,
        email: input.email.toLowerCase(),
        phone: input.phone,
        service_type: input.serviceType,
        appointment_date: new Date(input.appointmentDate).toISOString(),
        notes: input.notes,
        status: input.status,
        attachment_url: input.attachmentUrl
      })
      .select("*")
      .single<AppointmentRow>();

    if (error) {
      throwQueryError("Failed to create appointment", error);
    }
    if (!data) {
      throw new ApiError(503, "Failed to create appointment: no data returned.");
    }

    return mapAppointmentRow(data);
  },

  async listAppointments(options: AppointmentListOptions) {
    const supabase = getSupabaseAdmin();
    const start = (options.page - 1) * options.limit;
    const end = start + options.limit - 1;
    const sortColumn = sortColumns[options.sortBy] ?? "appointment_date";

    let query = supabase
      .from("appointments")
      .select("*", { count: "exact" })
      .order(sortColumn, { ascending: options.order === 1 })
      .range(start, end);

    if (options.userId) {
      query = query.eq("user_id", options.userId);
    }
    if (options.status) {
      query = query.eq("status", options.status);
    }
    if (options.serviceType) {
      query = query.eq("service_type", options.serviceType);
    }
    if (options.search) {
      const term = `%${escapeLike(options.search)}%`;
      query = query.or(`full_name.ilike.${term},email.ilike.${term},phone.ilike.${term}`);
    }
    if (options.appointmentDate) {
      const selected = new Date(options.appointmentDate);
      const nextMinute = new Date(selected.getTime() + 60000);
      query = query
        .gte("appointment_date", selected.toISOString())
        .lt("appointment_date", nextMinute.toISOString());
    }

    const { data, count, error } = await query.returns<AppointmentRow[]>();

    if (error) {
      throwQueryError("Failed to load appointments", error);
    }

    return {
      items: (data ?? []).map(mapAppointmentRow),
      total: count ?? 0
    };
  },

  async findAppointmentById(id: string) {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("appointments")
      .select("*")
      .eq("id", id)
      .maybeSingle<AppointmentRow>();

    if (error) {
      throwQueryError("Failed to load appointment", error);
    }

    return data ? mapAppointmentRow(data) : null;
  },

  async updateAppointment(id: string, input: Partial<AppointmentRecord>) {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("appointments")
      .update(normalizeAppointmentPayload(input))
      .eq("id", id)
      .select("*")
      .single<AppointmentRow>();

    if (error) {
      throwQueryError("Failed to update appointment", error);
    }
    if (!data) {
      throw new ApiError(503, "Failed to update appointment: no data returned.");
    }

    return mapAppointmentRow(data);
  },

  async deleteAppointment(id: string) {
    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from("appointments").delete().eq("id", id);

    if (error) {
      throwQueryError("Failed to delete appointment", error);
    }
  },

  async appointmentSummary() {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("appointments")
      .select("status")
      .returns<Array<Pick<AppointmentRow, "status">>>();

    if (error) {
      throwQueryError("Failed to load appointment summary", error);
    }

    const items = data ?? [];
    return {
      total: items.length,
      pending: items.filter((item) => item.status === "pending").length,
      confirmed: items.filter((item) => item.status === "confirmed").length,
      cancelled: items.filter((item) => item.status === "cancelled").length,
      completed: items.filter((item) => item.status === "completed").length
    };
  }
};
