# CareSync — Healthcare Appointment Booking Platform

> "Book the right doctor, know when they are available, track your queue, know the exact price, track refunds, and get real human support."

---

## Tech Stack

| Layer | Tech |
|---|---|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS, React Query, React Router v6 |
| Backend | Node.js, Express, TypeScript, Socket.IO |
| Database | PostgreSQL, Prisma ORM |
| Auth | JWT (access + refresh tokens), bcryptjs |
| Validation | Zod |
| Real-time | Socket.IO |

---

## Project Structure

```
caresync/
├── apps/
│   ├── api/          # Express backend
│   │   ├── src/
│   │   │   ├── controllers/
│   │   │   ├── routes/
│   │   │   ├── middleware/
│   │   │   ├── socket/
│   │   │   └── utils/
│   │   └── prisma/
│   │       ├── schema.prisma
│   │       └── seed.ts
│   └── web/          # React frontend
│       └── src/
│           ├── api/
│           ├── components/
│           ├── context/
│           ├── hooks/
│           ├── layouts/
│           ├── pages/
│           ├── types/
│           └── utils/
├── docker-compose.yml
└── .env.example
```

---

## Quick Start

### 1. Prerequisites

- Node.js 18+
- PostgreSQL 14+ (or Docker)

### 2. Environment Setup

```bash
cp .env.example .env
# Edit .env with your values
```

### 3. Start Database (Docker)

```bash
docker-compose up postgres -d
```

### 4. Install dependencies

```bash
npm install
cd apps/api && npm install
cd ../web && npm install
```

### 5. Set up database

```bash
# From apps/api/
npx prisma migrate dev --name init
npx tsx prisma/seed.ts
```

### 6. Run development servers

```bash
# API (from apps/api/)
npm run dev

# Frontend (from apps/web/)
npm run dev
```

- Frontend: http://localhost:5173
- API: http://localhost:3001
- API Health: http://localhost:3001/health

---

## Demo Credentials

| Role | Email | Password |
|---|---|---|
| Patient | patient@caresync.health | Patient@123 |
| Doctor | dr.priya.sharma@caresync.health | Doctor@123 |
| Admin | admin@caresync.health | Admin@123 |

---

## Features

### Patient
- Sign up / Login
- Search doctors by specialty, status, city, price, rating, gender
- Symptom-to-specialist matcher (rule-based, no external API)
- View doctor live status (Available / Busy / Delayed / On Leave / In Consultation / Offline)
- Book appointments with slot selection
- Live queue tracking with real-time position updates (Socket.IO)
- Check-in to appointments
- View appointment history
- Payment simulation
- Refund request & tracking with progress steps
- Support chat with ticket escalation to human agent
- Notifications (real-time via Socket.IO)
- Profile management

### Doctor
- Update live status
- View today's appointments
- Manage live queue (call next patient)
- Start / complete consultations

### Admin
- System statistics dashboard
- Doctor verification
- Refund approval / processing
- Support ticket monitoring

---

## API Endpoints

| Method | Route | Description |
|---|---|---|
| POST | /api/auth/register | Register |
| POST | /api/auth/login | Login |
| GET | /api/auth/me | Current user |
| GET | /api/doctors | Search doctors |
| GET | /api/doctors/:id | Doctor profile |
| GET | /api/doctors/:id/availability | Time slots |
| PATCH | /api/doctors/me/status | Update doctor status |
| POST | /api/appointments | Book appointment |
| GET | /api/appointments | List appointments |
| PATCH | /api/appointments/:id/checkin | Check in |
| PATCH | /api/appointments/:id/start | Start consultation |
| PATCH | /api/appointments/:id/complete | End consultation |
| GET | /api/queue/:doctorId | Live queue |
| POST | /api/symptoms/match | Symptom matcher |
| POST | /api/payments/:appointmentId/pay | Process payment |
| GET | /api/refunds/my | My refunds |
| POST | /api/refunds | Request refund |
| POST | /api/support/tickets | Create ticket |
| POST | /api/support/tickets/:id/messages | Send message |
| PATCH | /api/support/tickets/:id/escalate | Escalate to human |
| GET | /api/notifications | Notifications |
| GET | /api/admin/stats | Admin statistics |

---

## Real-time Events (Socket.IO)

| Event | Direction | Payload |
|---|---|---|
| `queue:updated` | Server → Client | Queue change data |
| `doctor:status_changed` | Server → Client | Doctor status |
| `notification:new` | Server → Client | Notification |
| `appointment:updated` | Server → Client | Appointment data |
| `support:message` | Server → Client | New chat message |

---

## Disclaimer

CareSync does not provide medical advice, diagnoses, or treatment recommendations. The symptom matcher is for specialist navigation only. Always consult a qualified healthcare professional.
