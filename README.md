 HEAD
# 🎓 Learnify — Online Learning Platform

A full-stack online learning platform built with the MERN stack, featuring real-time chat, AI chatbot, payment integration, and certificate generation.

## Tech Stack

| Layer | Tech |
|---|---|
| Frontend | React 18 + Vite + Tailwind CSS |
| Backend | Node.js + Express.js |
| Database | MongoDB + Mongoose |
| Auth | JWT (access + refresh tokens) |
| Real-time | Socket.io |
| File uploads | Multer |
| Payments | Razorpay |
| AI Chatbot | OpenAI API (GPT-3.5-turbo) |
| PDF Certs | PDFKit |

## Project Structure

```
learnify/
├── backend/
│   ├── config/         # DB connection, env config
│   ├── controllers/    # Route handler logic
│   ├── middleware/     # Auth, error, upload middleware
│   ├── models/         # Mongoose schemas
│   ├── routes/         # Express routers
│   ├── utils/          # Helpers (email, cert gen, etc.)
│   ├── uploads/        # Multer file storage
│   └── server.js       # Entry point
└── frontend/
    └── src/
        ├── components/ # Reusable UI components
        ├── context/    # React Context (Auth, Course, Chat)
        ├── hooks/      # Custom hooks
        ├── pages/      # Route-level page components
        └── utils/      # API helpers, constants
```

## Quick Start

### 1. Prerequisites
- Node.js >= 18
- MongoDB (local or Atlas)
- Razorpay account (for payments)
- OpenAI API key (for Alexa chatbot)

### 2. Backend Setup

```bash
cd backend
npm install
cp .env.example .env
# Fill in your .env values
npm run dev
```

### 3. Frontend Setup

```bash
cd frontend
npm install
cp .env.example .env
# Fill in your .env values
npm run dev
```

### 4. Environment Variables

**Backend `.env`:**
```
PORT=5000
MONGO_URI=mongodb://localhost:27017/learnify
JWT_SECRET=your_super_secret_jwt_key
JWT_REFRESH_SECRET=your_refresh_secret
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
OPENAI_API_KEY=your_openai_api_key
CLIENT_URL=http://localhost:5173
NODE_ENV=development
```

**Frontend `.env`:**
```
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
VITE_RAZORPAY_KEY_ID=your_razorpay_key_id
VITE_OPENAI_API_KEY=your_openai_api_key
```

## Default Admin Account

After first run, seed the DB:
```bash
cd backend
npm run seed
```
This creates:
- Admin: `admin@learnify.com` / `Admin@123`
- Demo student: `student@learnify.com` / `Student@123`
- 3 sample courses (2 free, 1 paid)

## API Endpoints

| Method | Route | Description |
|---|---|---|
| POST | /api/auth/register | Student registration |
| POST | /api/auth/login | Login (student/admin) |
| POST | /api/auth/refresh | Refresh JWT |
| GET | /api/courses | List all courses |
| POST | /api/courses | Create course (admin) |
| GET | /api/courses/:id | Course details |
| PUT | /api/courses/:id | Update course (admin) |
| DELETE | /api/courses/:id | Delete course (admin) |
| POST | /api/courses/:id/lectures | Add lecture (admin) |
| GET | /api/courses/:id/lectures | Get lectures |
| POST | /api/enrollments | Enroll in course |
| GET | /api/enrollments/my | My enrollments |
| POST | /api/enrollments/:id/progress | Update progress |
| GET | /api/enrollments/:id/certificate | Download certificate |
| POST | /api/quiz/:lectureId | Submit quiz |
| GET | /api/quiz/:lectureId | Get quiz questions |
| POST | /api/payment/order | Create Razorpay order |
| POST | /api/payment/verify | Verify payment |
| GET | /api/chat/messages/:userId | Chat history |
| POST | /api/chat/messages | Send message |
| GET | /api/admin/stats | Dashboard analytics |

## Features

### Student
- Browse free & paid courses
- Watch video lectures (in-platform + YouTube)
- Take MCQ quizzes after each lecture
- Track progress with visual progress bars
- Download PDF certificate on completion
- Real-time chat with admin (Socket.io)
- AI chatbot "Alexa" (OpenAI GPT-3.5)
- Razorpay payment for paid courses

### Admin
- Full course CRUD
- Upload videos (Multer) & thumbnails
- Manage lectures and quizzes
- View all student enrollments
- Real-time chat with all students
- Analytics dashboard (students, courses, revenue)

## Grading Criteria Coverage

| Criteria | Implementation |
|---|---|
| Functionality | Course CRUD, enrollment, quiz, progress, certificates, payments |
| UI/UX | Tailwind CSS, mobile-first, smooth animations, progress bars, modals |
| Error Handling | Custom error middleware, input validation, user-friendly messages |
| Code Quality | MVC pattern, async/await, JSDoc comments, named exports |
| Security | JWT + refresh tokens, bcrypt, route guards, file type validation |

# learnify
Full Stack LMS Platform (MERN)
 6572c84952c5f5721cd199c9120b444e0b03a2c0
