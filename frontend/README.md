# Examination Management System

## Setup Instructions

### 1. Database (MySQL)
- Create a database named `exam_db`.
- Run the SQL in `db/schema.sql` to create tables.
- Add at least one admin and one student to the `users` table. Passwords must be bcrypt-hashed.

### 2. Backend
- Go to the `backend` folder:
  ```bash
  cd backend
  npm install
  ```
- Create a `.env` file with your DB and email credentials:
  ```env
  DB_HOST=localhost
  DB_USER=your_mysql_user
  DB_PASSWORD=your_mysql_password
  DB_NAME=exam_db
  JWT_SECRET=your_jwt_secret
  EMAIL_USER=your_gmail_address
  EMAIL_PASS=your_gmail_app_password
  ```
- Start the backend:
  ```bash
  node src/app.js
  ```

### 3. Frontend
- Go to the `frontend` folder:
  ```bash
  cd frontend
  npm install
  npm start
  ```
- The app will run at [http://localhost:3000](http://localhost:3000)

## Backend API Endpoints

### Auth
- `POST /api/auth/login` — Login

### Admin
- `POST /api/admin/students` — Add student
- `POST /api/admin/exams` — Create exam
- `POST /api/admin/groups` — Add group
- `GET /api/admin/students` — List students
- `GET /api/admin/exams` — List exams
- `GET /api/admin/groups` — List groups
- `GET /api/admin/forms` — List forms
- `POST /api/admin/forms/:id/accept` — Accept form & send email

### Student
- `GET /api/student/exams/:studentId` — List available exams
- `POST /api/student/forms` — Submit exam form
- `GET /api/student/forms/:studentId` — List my forms
- `GET /api/student/hallticket/:formId` — Download hall ticket (PDF)

## Troubleshooting
- If login fails with 500 error, check your DB connection and ensure users exist with bcrypt-hashed passwords.
- If email or PDF fails, check your `.env` and install all dependencies.

## Features
- Admin: Manage students, exams, groups, forms, accept forms, send email
- Student: View exams, submit forms, download hall ticket
- Responsive UI for all devices
