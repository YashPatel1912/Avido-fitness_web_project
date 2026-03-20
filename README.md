# 🏋️‍♂️ Avido Fitness

**Avido Fitness** is a scalable, full-stack fitness platform that helps users manage workouts, nutrition, and health goals. Built with modern technologies and deployed using Docker and CI/CD pipelines, this project demonstrates real-world production architecture and DevOps practices.

---

## 🌟 Live Demo

🚀 Frontend: https://avido-fitness-web-project.vercel.app/  
🚀 Backend API: https://avido-fitness.onrender.com/

---

## 📌 Overview

Avido Fitness is a production-grade PERN application designed with performance, scalability, and maintainability in mind.

It follows a modern architecture with:

- Separate frontend and backend Docker containers
- Automated CI/CD pipeline using GitHub Actions
- Cloud deployment using Vercel (Frontend) and Render (Backend)

---

## 🚀 Features

- Fully responsive UI (mobile + tablet + desktop)
- Personalized workout and nutrition planning
- Secure authentication and session handling
- Stripe payment integration (subscriptions & purchases)
- RESTful API architecture
- Dockerized frontend and backend
- CI/CD automation with GitHub Actions
- Production-ready deployment

---

## 🧱 Architecture

```
Client (React)
     │
     ▼
Backend API (Node.js + Express)
     │
     ▼
PostgreSQL Database
```

## ⚙️ DevOps Workflow

### 🔹 Frontend Deployment (Vercel)

```
Code Push → GitHub → GitHub Actions → Build → Vercel Deploy
```

- Frontend is deployed on Vercel
- Optimized for React apps (fast CDN, edge network)

---

### 🔹 Backend Deployment (Render + Docker)

```
Code Push → GitHub → GitHub Actions → Docker Build → Docker Hub → Render Deploy
```

- Backend runs inside Docker container
- Image pushed to Docker Hub
- Render pulls image and deploys automatically

---

### 🧱 Full Deployment Architecture

```
             ┌───────────────┐
             │   Frontend    │
             │   (Vercel)    │
             └──────┬────────┘
                    │
                    ▼
             ┌───────────────┐
             │   Backend     │
             │ (Render + Docker)
             └──────┬────────┘
                    │
                    ▼
             ┌───────────────┐
             │ PostgreSQL DB │
             └───────────────┘
```
---

## 🛠️ Tech Stack

### Frontend

- React.js
- HTML5
- CSS3

### Backend

- Node.js
- Express.js

### Database

- PostgreSQL
- Drizzle ORM

### DevOps & Deployment

- Docker
- Docker Hub
- GitHub Actions (CI/CD)
- Render
- vercel

### Payments

- Stripe API

---

## 🐳 Docker Setup

### Build Docker Images

```bash
# Backend Image
docker build -t yashpatel33/avido-fitness-server-app:latest ./server

# Frontend Image
docker build -t yashpatel33/avido-fitness-client-app:latest ./client
```

### Push Images to Docker Hub

```bash
docker push yashpatel33/avido-fitness-server-app:latest
docker push yashpatel33/avido-fitness-client-app:latest
```

---

## ⚡ CI/CD Pipeline (GitHub Actions)

This project uses GitHub Actions to automate:

- Build Docker images
- Push images to Docker Hub
- Trigger deployment on Render
- Trigger deployment on vercel

---

## ⚙️ Environment Variables

### Backend (.env)

```
PORT=4000
DATABASE_URL=your_postgresql_connection_string
STRIPE_SECRET_KEY=your_stripe_secret_key
SESSION_SECRET=your_session_secret
CLIENT_URL=https://avido-fitness-web-project.vercel.app
```

### Frontend (.env)

```
VITE_API_URL=https://avido-fitness.onrender.com
```

---

## 📁 Project Structure

```
avido-fitness/
│
├── frontend/                # React App (Dockerized)
├── backend/                 # Node.js API (Dockerized)
├── .github/workflows/       # CI/CD pipelines
├── docker-compose.yml       # Optional (local setup)
└── README.md
```

---

## 🔐 Security

- Environment variables managed via GitHub Secrets
- Secure Stripe payment integration
- CORS configured for production
- Session-based authentication

---

## 🧪 Future Enhancements

- AI-based fitness recommendations
- Progress tracking dashboard
- Meal planning system
- Push notifications
- Mobile app version

---

## 📬 Contact

Email: yash01912@gmail.com  
LinkedIn: https://www.linkedin.com/in/yash-patel-9558b62a7  
GitHub: https://github.com/YashPatel1912

---

## 👨‍💻 Author

**Yash Patel**

---

## ⭐ Support

If you like this project:

- Star the repository
- Fork it
- Share it

---

## 🏆 Resume Highlight

Built and deployed a full-stack fitness platform using Docker, CI/CD (GitHub Actions), and cloud deployment (Render) with separate frontend and backend containers, demonstrating strong DevOps and production deployment skills.
