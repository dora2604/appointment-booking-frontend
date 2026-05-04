# Appointment Booking System

## 1. Project Overview

Appointment Booking System is a full-stack web application for booking and managing service appointments. Users can register, log in, create appointments, upload attachments, search/filter records, and track appointment status. Admin accounts can view all appointments, update statuses, and see dashboard summary metrics.

This project follows the required stack:

- Frontend: Angular + Tailwind CSS
- Backend: Node.js + Express + TypeScript
- Database: MongoDB with Mongoose

## 2. Live Links

Update these after deployment:

- Frontend URL: `https://your-frontend-url.example.com`
- Backend API URL: `https://your-backend-url.example.com/api`
- Swagger/OpenAPI Docs: `https://your-backend-url.example.com/api/docs`

## 3. Tech Stack

- Frontend: Angular 19, Angular Router, Route Guards, Reactive Forms, RxJS, Tailwind CSS
- Backend: Node.js, Express, TypeScript, JWT, Express Validator, Multer
- Database: MongoDB, Mongoose
- API Documentation: Swagger UI, swagger-jsdoc
- Security/Middleware: CORS, Helmet, Morgan logging, centralized error handling

## 4. Setup Instructions

### Prerequisites

- Node.js 18+
- MongoDB local or MongoDB Atlas account

MongoDB is the required database for normal project use. The server will not start if `MONGO_URI` is invalid or MongoDB is offline.

### Install Dependencies

```bash
npm run install:all
```

### Backend Setup

```bash
cd server
cp .env.example .env
npm run build
npm start
```

Backend runs at:

```text
http://localhost:5000
```

Health check:

```text
http://localhost:5000/api/health
```

Swagger docs:

```text
http://localhost:5000/api/docs
```

### Frontend Setup

```bash
cd client
npm start
```

Frontend runs at:

```text
http://localhost:4200
```

### Environment Variables

`server/.env`

```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/appointment_booking
JWT_SECRET=replace_with_secure_secret
JWT_EXPIRES_IN=7d
CLIENT_ORIGIN=http://localhost:4200
ALLOW_DEMO_STORAGE=false
```

Use MongoDB Atlas by replacing `MONGO_URI` with your Atlas connection string:

```env
MONGO_URI=mongodb+srv://USERNAME:PASSWORD@CLUSTER.mongodb.net/appointment_booking?retryWrites=true&w=majority
```

Only for emergency classroom demo without MongoDB, set:

```env
ALLOW_DEMO_STORAGE=true
```

That mode stores temporary data in `server/data/demo-db.json` and should not be used for final deployment.

For Angular development, update:

```text
client/src/environments/environment.ts
```

For Angular production builds, update:

```text
client/src/environments/environment.prod.ts
```

## 5. API Overview

Base URL:

```text
/api
```

### Auth

- `POST /auth/register` - Register a user or admin account
- `POST /auth/login` - Log in and receive a JWT token
- `GET /auth/me` - Get the current authenticated user

### Appointments

- `POST /appointments` - Create an appointment
- `GET /appointments` - List appointments with search, filtering, and pagination
- `GET /appointments/:id` - Get one appointment
- `PUT /appointments/:id` - Update an appointment
- `DELETE /appointments/:id` - Delete an appointment
- `GET /appointments/admin/summary` - Admin-only appointment summary

### File Upload

- `POST /uploads` - Upload appointment attachment, image or PDF

### Utility

- `GET /health` - API health check
- `GET /docs` - Swagger UI

## 6. Features Implemented

- User Registration and Login
- JWT Authentication
- Role-based Authorization for Admin/User
- Angular Route Guards
- Appointment CRUD
- Search, Filtering, and Pagination
- Admin Dashboard Summary
- File Upload with Multer
- Frontend and Backend Integration via Angular HTTP Client
- RxJS Observables and operators
- Reactive Forms with Validation
- Loading and Error States
- Responsive Tailwind CSS UI
- Express Routing, Controllers, and Middleware
- Input Validation and Sanitization
- Swagger/OpenAPI Documentation
- MongoDB Integration with Mongoose

## 7. Screenshots

Add screenshots inside the `screenshots/` folder before GitHub submission.

Required suggested files:

- `screenshots/ui-login.png`
- `screenshots/ui-register.png`
- `screenshots/ui-dashboard.png`
- `screenshots/ui-admin.png`
- `screenshots/api-postman-auth.png`
- `screenshots/api-postman-appointments.png`
- `screenshots/api-swagger.png`

## Demo Accounts

You can create accounts from the Register page. For presentation, create one `User` account and one `Admin` account.

Example:

- Admin: `admin@test.com` / `password123`
- User: `user@test.com` / `password123`

## Repository Structure

```text
appointment-booking-system/
├── client/       Angular + Tailwind frontend
├── server/       Node.js + Express + TypeScript API
├── screenshots/  UI and API screenshots
├── .env          Root environment reference
└── README.md     Main project guide
```

## Deployment Notes

Deploy both apps separately:

- Frontend: Vercel, Netlify, or similar
- Backend API: Render, Railway, Fly.io, or similar
- Database: MongoDB Atlas

Production checklist:

- Set backend environment variables in the hosting platform.
- Set `CLIENT_ORIGIN` to the deployed frontend URL.
- Update `client/src/environments/environment.prod.ts` with the deployed backend API URL.
- Rebuild and redeploy the frontend after changing the API URL.
- Confirm deployed `/api/health` and `/api/docs` work before presentation.
