# 🏡 TheNigerianProperties

**TheNigerianProperties** is a full-stack property listing platform built for the Nigerian real estate market. Users can create, browse, and manage property listings with images, pricing, and location details.

🔗 **Live Demo:** https://www.thenigerianproperties.com

---

## 🚀 Tech Stack

### Frontend
- Next.js
- React
- Vite
- CSS

### Backend
- Node.js
- Express.js

### Database
- MongoDB

### Authentication
- JWT (JSON Web Tokens)
- Cookies
- Token-based authentication  
Sessions and OAuth are not used.

### Image Storage
- Cloudinary

### Hosting
- Frontend: Vercel  
- Backend: Render

---

## ✨ Core Features

- User authentication (signup, login, logout)
- Create property listings
- Upload multiple property images
- Edit and delete listings
- Browse available properties
- Search and filter listings
- Secure backend APIs
- Cloud-hosted images

---

## 🧩 Project Structure

This project is split into two repositories:

- Frontend repository  
  Handles UI, user interactions, and API requests

- Backend repository  
  Handles authentication, database logic, image uploads, and API endpoints

Both repositories belong to the same product.

---

## 🔌 API Overview (Backend)

Base URL (local development):

http://localhost:3000/api

yaml
Copy code

Common endpoints:

POST /auth/register
POST /auth/login
POST /listings/create
GET /listings
PUT /listings/:id
DELETE /listings/:id

yaml
Copy code

---

## 🛠️ Installation & Setup

Clone the repository:

git clone https://github.com/your-username/your-repo-name.git

yaml
Copy code

Install dependencies:

npm install

yaml
Copy code

Run locally:

npm run dev

yaml
Copy code

Environment variables are intentionally excluded for security reasons.

---

## 🎯 Project Purpose

This project is a real estate startup idea focused on improving property listing and discovery within Nigeria.

Use cases:
- Startup MVP
- Portfolio showcase
- Real-world full-stack practice

---

## 👤 Author

Bernard E. Ekoli

---

## 📜 License

This project is currently unlicensed.