# 🍱 VJ Home Foods – Order Management System

A full-stack web application for managing food orders, batches, members, billing, deliveries, complaints, and food requests for **VJ Home Foods**.

---

# 🏗️ Tech Architecture

```
                Frontend
         Vue.js 3 + Vite + Axios
                    │
            REST API (HTTPS)
                    │
        Node.js + Express.js
                    │
        JWT Authentication
                    │
      MongoDB Atlas + Mongoose
```

---

# ⚙️ Installation

## Clone the Repository

```bash
git clone https://github.com/vjhomefood/vj_admin.git
cd vj_admin
```

## Backend

```bash
cd backend
npm install
```

Create a `.env` file:

```env
PORT=5001
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key
```

Run the server:

```bash
npm run dev
```

## Frontend

```bash
cd frontend
npm install
npm run dev
```

---

# 🚀 Deployment


| Service | Platform |
|---------|----------|
| Frontend | Vercel |
| Backend | Render |
| Database | MongoDB Atlas |
---

# 🔒 Security

- JWT Authentication
- Password Hashing (bcrypt)
- Protected REST APIs
- Environment Variables
- CORS
- Compressed API Responses

---

Developed for **VJ Home Foods** 🍱
