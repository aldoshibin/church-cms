# Grace Church Management System

A full-stack church management system built with **Django + MySQL** backend and **Next.js + Tailwind CSS** frontend.

## 🏗️ Tech Stack
- **Backend**: Django 4, Django REST Framework, JWT Auth, MySQL
- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS
- **Communication**: Email (SMTP/Gmail), SMS (Twilio)

## 🚀 Quick Start

### 1. MySQL Database Setup
```sql
CREATE DATABASE church_cms CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'church_user'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON church_cms.* TO 'church_user'@'localhost';
FLUSH PRIVILEGES;
```

### 2. Backend Setup
```bash
cd backend
pip install -r requirements.txt
cp .env.example .env        # Edit with your DB credentials
python manage.py migrate
python manage.py seed_demo  # Creates demo data + admin user
python manage.py runserver  # Runs on http://localhost:8000
```

### 3. Frontend Setup
```bash
cd frontend
npm install
cp .env.local.example .env.local   # Edit API URL if needed
npm run dev   # Runs on http://localhost:3000
```

### 4. Login
- **Admin**: admin@church.com / admin123

## 📦 Features

### 👥 Member Management
- Add/edit/delete members with full profile
- Family grouping
- Status tracking (Active, Inactive, Visitor, Transferred)
- Ministry group assignments
- Birthday tracking

### 💰 Finance
- **Donations**: Record cash, UPI, bank transfer, online
- **Funds**: General, Building Fund, Mission Fund with progress tracking
- **Pledges**: Track member pledges with fulfillment tracking
- **Expenses**: Record and approve church expenses
- **Email Receipts**: Auto-send donation receipts

### 📅 Events & Attendance
- Create events (Worship, Youth, Choir, Outreach, etc.)
- Mark attendance for members and visitors

### 📧 Communication
- Send bulk **Email** to members
- Send bulk **SMS** via Twilio
- Target specific groups (All, Choir, Youth, etc.)
- Message history with delivery tracking

### 🔐 User Roles & Permissions
| Role | Permissions |
|------|-------------|
| Admin | Full access |
| Pastor | Members, Events, Communications |
| Treasurer | Finance & Reports |
| Secretary | Members, Events, Communications |
| Member | Read-only own profile |
| Volunteer | Basic access |

### 📊 Reports
- Monthly giving trends
- Membership statistics
- Fund progress

## 🔧 Environment Variables

### Backend (.env)
```
DB_NAME=church_cms
DB_USER=church_user
DB_PASSWORD=your_password
DB_HOST=localhost
DB_PORT=3306

EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_HOST_USER=your@gmail.com
EMAIL_HOST_PASSWORD=your_app_password

TWILIO_ACCOUNT_SID=your_sid
TWILIO_AUTH_TOKEN=your_token
TWILIO_PHONE_NUMBER=+1234567890

CHURCH_NAME=Grace Church
CHURCH_CURRENCY=₹
```

## 📂 Project Structure
```
church-cms/
├── backend/
│   ├── church_backend/    # Django settings & URLs
│   ├── core/              # User model, auth, dashboard
│   ├── members/           # Members, Families, Ministries
│   ├── finance/           # Donations, Pledges, Expenses, Funds
│   ├── events/            # Events & Attendance
│   └── communication/     # Email & SMS
├── frontend/
│   ├── app/               # Next.js App Router pages
│   │   ├── login/
│   │   ├── dashboard/
│   │   ├── members/
│   │   ├── families/
│   │   ├── donations/
│   │   ├── events/
│   │   ├── attendance/
│   │   ├── communication/
│   │   ├── users/
│   │   └── reports/
│   ├── components/
│   │   ├── layout/        # Sidebar, Header, DashboardLayout
│   │   └── members/       # MemberModal
│   └── lib/               # API client, auth utilities
└── README.md
```

## 🔗 API Endpoints
- `POST /api/auth/login/` — Login
- `GET  /api/dashboard/` — Dashboard stats
- `CRUD /api/members/` — Members
- `CRUD /api/families/` — Families
- `CRUD /api/ministries/` — Ministries
- `CRUD /api/donations/` — Donations
- `POST /api/donations/{id}/send_receipt/` — Send email receipt
- `CRUD /api/pledges/` — Pledges
- `CRUD /api/expenses/` — Expenses
- `CRUD /api/funds/` — Funds
- `CRUD /api/events/` — Events
- `POST /api/events/{id}/attendance/` — Mark attendance
- `POST /api/messages/send_quick/` — Send email/SMS
- `CRUD /api/users/` — User management
