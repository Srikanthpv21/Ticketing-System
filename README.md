# 🎫 Ticketing System — Help Desk / Support Portal

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE) [![Built with Django & React](https://img.shields.io/badge/Stack-Django%20%7C%20React-lightgrey.svg)](#-tech-stack) [![OpenAI](https://img.shields.io/badge/AI-OpenAI-orange.svg)](https://openai.com)

A polished, full-stack Help Desk / Ticketing System where customers raise support tickets, agents manage and resolve them, and admins oversee the entire system with analytics. Includes AI-powered ticket categorization and a role-based workflow.

---

## ✨ Highlights
- Clean role-based access: Customer, Agent, Admin
- AI-powered automatic ticket categorization (OpenAI)
- Threaded comments (customer / internal agent notes)
- Status workflow: `OPEN → IN_PROGRESS → RESOLVED → CLOSED`
- Docker-ready and environment-driven configuration for production

---

## 🖼️ Demo
> Replace the image below with an actual screenshot or GIF of your app to make this section pop.

![App screenshot placeholder](https://via.placeholder.com/1200x480.png?text=Ticketing+System+Preview)

---

## 📚 Table of Contents
- [Tech Stack](#-tech-stack)
- [User Roles](#-user-roles)
- [Key Features](#-key-features)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [API Endpoints (Quick)](#api-endpoints-quick)
- [Deploy](#-deploy)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🚀 Tech Stack
Backend
- Django
- Django REST Framework
- JWT Authentication (SimpleJWT)
- SQLite (dev) / PostgreSQL (production-ready)
- OpenAI API (AI categorization)

Frontend
- React (Vite)
- Tailwind CSS
- Axios
- React Router

DevOps
- Docker-ready architecture
- Environment-variable driven config

---

## 👥 User Roles & Capabilities

| Role     | Capabilities |
|---------:|--------------|
| Customer | Create tickets, chat with agent, track ticket status |
| Agent    | View & reply to assigned tickets, update status, add internal notes |
| Admin    | View all tickets, system analytics, user overview |

---

## 🧠 Key Features

- Authentication & Authorization
  - JWT-based login/logout
  - Secure role-based access
  - `/auth/me/` endpoint for frontend state

- Ticket Management
  - Create tickets (customers only)
  - Auto-assign agents (configurable)
  - Priority & category support

- Customer–Agent Chat
  - Threaded comments per ticket
  - Internal comments hidden from customers
  - Real-time style UI (polling-based) — easy to upgrade to websockets

- AI Integration
  - Automatic ticket categorization using OpenAI
  - Categories: `Login`, `Payment`, `Bug`, `Feature`, `Other`
  - Safe fallback when API key is missing

- Admin Analytics
  - Total tickets overview
  - Counts by status (Open / In Progress / Resolved)
  - Ticket table & user overview

---

## 🛠️ Getting Started (Local development)

Clone the repo:
```bash
git clone https://github.com/Srikanthpv21/Ticketing-System.git
cd Ticketing-System
```

Backend (Python / Django)
```bash
# create virtualenv and install
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# run migrations & start server
python manage.py migrate
python manage.py runserver
```

Frontend (React / Vite)
```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:8000 (backend) and http://localhost:3000 (frontend by default for Vite).

---

## ⚙️ Environment Variables (example)
Create a `.env` file for backend with:
```
DJANGO_SECRET_KEY=your-secret-key
DATABASE_URL=postgres://user:pass@host:port/dbname
OPENAI_API_KEY=sk-...
SIMPLE_JWT_ACCESS_TOKEN_LIFETIME=60m
```

Frontend `.env` (Vite)
```
VITE_API_BASE_URL=http://localhost:8000/api
```

---

## 🔍 Quick API Endpoints
- POST /auth/login/ — login (returns JWT)
- GET /auth/me/ — current user + role
- POST /tickets/ — create ticket (customer)
- GET /tickets/ — list tickets (role-based)
- GET /tickets/:id/ — ticket detail + comments
- POST /tickets/:id/comments/ — add comment
- POST /tickets/:id/assign/ — assign agent (admin/auto-assign)
- GET /analytics/ — admin stats

(See the code for full OpenAPI / DRF endpoints.)

---

## 📦 Docker (quick)
A Dockerfile and docker-compose are included for quick production-like setup.
```bash
docker-compose up --build
```
This spins up the backend, frontend, and a PostgreSQL database (if configured).

---

## 🤝 Contributing
Contributions welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Open a pull request with a clear description and tests where appropriate

Please follow the code style and include meaningful commit messages.

---

## 📄 License
This project is released under the MIT License. See [LICENSE](LICENSE) for details.

---

If you'd like, I can:
- Add actual badges (build, coverage) linked to your repo,
- Insert real screenshots/GIFs if you upload them,
- Convert the Quick API section into a full OpenAPI/Swagger example.

Happy to apply any of these — tell me which and I’ll update the README.
