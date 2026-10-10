# Viora Dental Center — Full-Stack Dental Clinic Platform

A modern, production-ready website and management portal for **Viora Dental Center**, a premier aesthetic and family dental clinic in Addis Ababa, Ethiopia.

---

## 🌟 Highlights & Key Features

### 1. Public Clinic Experience
- **Responsive & Accessible**: Clean, calming aesthetic inspired by Viora's azure blue tooth-smile identity. Generous whitespace, rounded cards, and smooth micro-interactions.
- **Dynamic Services & Fee Guide**: Comprehensive treatment catalog (General Exams, Ultrasonic Hygiene, Porcelain Veneers, Clear Aligners, Dental Implants, In-Office Whitening, Microscopic Root Canal, and Pediatric Care) with transparent pricing in Ethiopian Birr (ETB) and duration.
- **Doctor Profiles**: Detailed credentials, European fellowships, years of experience, and individual booking actions.
- **Interactive Smile Gallery**: Side-by-side Before/After comparison slider and split-screen mode for real patient cases.
- **Dental Tips & Educational Blog**: Oral hygiene guides and preventive articles written by practicing dental clinicians.
- **Clinic Inquiries & Location**: Bole Sub-City clinic address, direct telephone lines (+251 911 234 567), working hours (Mon–Sat), and Google Maps integration.
- **Collision-Proof Real-Time Scheduling**: Multi-step booking flow (Service → Doctor → Date & Slot → Patient Info → Confirmation) that dynamically recalculates open slots against active bookings. **Patient email is strictly optional**.

### 2. Role-Based Admin Dashboard (RBAC)
- **Role Hierarchy**:
  - `super_admin`: Full administrative control, user account provisioning, credential overrides, doctor deletion, audit logs, and page-by-page SEO meta management.
  - `doctor_manager`: Full CRUD on doctor profiles, clinic treatments/fees, Before/After cases, and schedules.
  - `receptionist`: Appointment triage (confirm, reschedule, cancel), contact inquiries, and **Walk-In Patient registration (email optional)**.
  - `doctor`: View personal appointment agenda and publish/edit dental hygiene tips and blog articles.
- **Self-Service & Admin Credential Management**: Staff can change their own username and password. Super Admins can also reset usernames and passwords for any staff member.
- **Before & After Media Pairing CMS**: Upload, pair, categorize, and label Before & After image sets.
- **Doctor Working Hours & Days Off**: Configurable weekly schedule (Mon–Sat) and designated leave days.
- **Audit Logging**: Comprehensive activity logs tracking every doctor profile edit, appointment update, and CMS change.
- **SEO & Metadata Control**: Live admin controls for `<title>`, meta descriptions, and OpenGraph tags per page.

---

## 🔐 Demo Credentials

Use any of the following pre-seeded accounts to explore the RBAC system:

| Role | Username | Password | Access Capabilities |
| :--- | :--- | :--- | :--- |
| **Super Admin** | `superadmin` | `Admin@123` | Full system control, RBAC staff management, SEO, Audit logs |
| **Receptionist** | `reception` | `Staff@123` | Appointment triage, walk-in registration, patient inquiries |
| **Doctor Manager** | `doc_manager` | `Staff@123` | Doctor profiles, service fees, gallery, schedules |
| **Doctor (Lead)** | `dr_selamawit`| `Staff@123` | Personal appointment schedule, dental tips blog publishing |

---

## 🛠️ Architecture & Tech Stack

```text
viora-dental/
├── client / frontend (React + Vite + Tailwind CSS + Lucide Icons)
│   ├── src/api/                # Strongly-typed Axios client with JWT interceptor
│   ├── src/components/layout/  # Top-bar contract Navbar, Footer, Dynamic SEO Head
│   ├── src/components/ui/      # Interactive BeforeAfterSlider, Modals, Badges
│   ├── src/components/admin/   # AdminLayout, RBAC Sidebar, Credential Reset Modal
│   ├── src/context/            # AuthContext (JWT session), ToastContext
│   ├── src/pages/public/       # Home, Services, About, Gallery, Blog, Contact, Book
│   └── src/pages/admin/        # Dashboard, Appointments, Doctors, Services, Gallery,
│                               # Dental Tips, Schedules, Messages, Users, SEO, Audit
│
├── server / backend (Node.js + Express + JWT + bcrypt + Availability Engine)
│   ├── src/server/routes/api.ts        # REST endpoints with rate limiting & RBAC
│   ├── src/server/db/store.ts          # Persistent thread-safe JSON/DB engine
│   ├── src/server/services/            # Real-time slot availability & confirmation emails
│   ├── src/server/utils/jwt.ts         # Secure JWT token signing & verification
│   └── server.ts                       # Unified Express server mounting Vite in dev
│
└── standalone server (Optional deploy to Render / Railway / MongoDB Atlas)
    ├── server/src/models/              # Mongoose schemas with compound unique index
    ├── server/src/config/db.js         # MongoDB connection helper
    └── server/src/seed/seed.js         # Database seed script
```


## 🛡️ Double-Booking Prevention

Appointments require a unique composite key of `(dentistId, date, startTime)` for non-cancelled statuses:
1. **Dynamic Generation**: When a patient or receptionist selects a doctor and date, `/api/appointments/availability?dentistId=&date=` calculates available 30-minute intervals from the doctor's working hours, subtracting existing booked slots.
2. **Atomic Verification**: Upon booking submission, the server re-validates the slot atomically. If a race condition occurs, HTTP `409 Conflict` is returned and the UI refreshes available time slots.
3. **Mongoose Database Level**: In MongoDB, the `Appointment` model applies a partial unique compound index:
   ```javascript
   appointmentSchema.index(
     { dentist: 1, date: 1, startTime: 1 },
     { unique: true, partialFilterExpression: { status: { $ne: 'cancelled' } } }
   );
   ```
