import fs from "fs";
import path from "path";
import crypto from "crypto";

export type StoredUser = {
  _id: string;
  name: string;
  email: string;
  password: string;
  role: "admin" | "user";
  createdAt: string;
  updatedAt: string;
};

export type StoredAppointment = {
  _id: string;
  userId: string;
  fullName: string;
  email: string;
  phone: string;
  serviceType: "consultation" | "follow_up" | "therapy" | "dental";
  appointmentDate: string;
  notes?: string;
  status: "pending" | "confirmed" | "cancelled" | "completed";
  attachmentUrl?: string;
  createdAt: string;
  updatedAt: string;
};

type StoreData = {
  users: StoredUser[];
  appointments: StoredAppointment[];
};

const dataDir = path.join(process.cwd(), "data");
const dataFile = path.join(dataDir, "demo-db.json");

const emptyStore = (): StoreData => ({ users: [], appointments: [] });

const ensureStore = () => {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  if (!fs.existsSync(dataFile)) {
    fs.writeFileSync(dataFile, JSON.stringify(emptyStore(), null, 2));
  }
};

const readStore = (): StoreData => {
  ensureStore();
  const raw = fs.readFileSync(dataFile, "utf-8");
  return raw ? (JSON.parse(raw) as StoreData) : emptyStore();
};

const writeStore = (data: StoreData) => {
  ensureStore();
  fs.writeFileSync(dataFile, JSON.stringify(data, null, 2));
};

export const createId = () => crypto.randomBytes(12).toString("hex");

export const fileStore = {
  findUserByEmail(email: string) {
    const data = readStore();
    return data.users.find((user) => user.email.toLowerCase() === email.toLowerCase()) ?? null;
  },

  createUser(input: Pick<StoredUser, "name" | "email" | "password" | "role">) {
    const data = readStore();
    const now = new Date().toISOString();
    const user: StoredUser = {
      _id: createId(),
      ...input,
      email: input.email.toLowerCase(),
      createdAt: now,
      updatedAt: now
    };
    data.users.push(user);
    writeStore(data);
    return user;
  },

  createAppointment(input: Omit<StoredAppointment, "_id" | "createdAt" | "updatedAt">) {
    const data = readStore();
    const now = new Date().toISOString();
    const appointment: StoredAppointment = {
      _id: createId(),
      ...input,
      appointmentDate: new Date(input.appointmentDate).toISOString(),
      createdAt: now,
      updatedAt: now
    };
    data.appointments.push(appointment);
    writeStore(data);
    return appointment;
  },

  listAppointments(options: {
    userId?: string;
    search?: string;
    status?: string;
    serviceType?: string;
    from?: string;
    to?: string;
    page: number;
    limit: number;
    sortBy: string;
    order: 1 | -1;
  }) {
    const data = readStore();
    let items = [...data.appointments];

    if (options.userId) {
      items = items.filter((item) => item.userId === options.userId);
    }
    if (options.search) {
      const term = options.search.toLowerCase();
      items = items.filter((item) =>
        [item.fullName, item.email, item.phone].some((value) => value.toLowerCase().includes(term))
      );
    }
    if (options.status) {
      items = items.filter((item) => item.status === options.status);
    }
    if (options.serviceType) {
      items = items.filter((item) => item.serviceType === options.serviceType);
    }
    if (options.from) {
      const fromTime = new Date(options.from).getTime();
      items = items.filter((item) => new Date(item.appointmentDate).getTime() >= fromTime);
    }
    if (options.to) {
      const toTime = new Date(options.to).getTime();
      items = items.filter((item) => new Date(item.appointmentDate).getTime() <= toTime);
    }

    items.sort((a, b) => {
      const aValue = String(a[options.sortBy as keyof StoredAppointment] ?? "");
      const bValue = String(b[options.sortBy as keyof StoredAppointment] ?? "");
      return aValue.localeCompare(bValue) * options.order;
    });

    const total = items.length;
    const start = (options.page - 1) * options.limit;
    return {
      items: items.slice(start, start + options.limit),
      total
    };
  },

  findAppointmentById(id: string) {
    const data = readStore();
    return data.appointments.find((appointment) => appointment._id === id) ?? null;
  },

  updateAppointment(id: string, input: Partial<StoredAppointment>) {
    const data = readStore();
    const index = data.appointments.findIndex((appointment) => appointment._id === id);
    if (index === -1) {
      return null;
    }
    data.appointments[index] = {
      ...data.appointments[index],
      ...input,
      appointmentDate: input.appointmentDate
        ? new Date(input.appointmentDate).toISOString()
        : data.appointments[index].appointmentDate,
      updatedAt: new Date().toISOString()
    };
    writeStore(data);
    return data.appointments[index];
  },

  deleteAppointment(id: string) {
    const data = readStore();
    const initialLength = data.appointments.length;
    data.appointments = data.appointments.filter((appointment) => appointment._id !== id);
    writeStore(data);
    return data.appointments.length !== initialLength;
  },

  appointmentSummary() {
    const data = readStore();
    return {
      total: data.appointments.length,
      pending: data.appointments.filter((item) => item.status === "pending").length,
      confirmed: data.appointments.filter((item) => item.status === "confirmed").length,
      cancelled: data.appointments.filter((item) => item.status === "cancelled").length,
      completed: data.appointments.filter((item) => item.status === "completed").length
    };
  }
};
