# 👥 FriendsBook – Full-Stack Social Media Platform

FriendsBook is a **full-stack MERN social media application** with **real-time messaging**, **secure authentication**, and **rich media sharing**.  
It offers a feature-rich experience where users can connect, chat, post content, and engage with friends, while also having an extra layer of account security through the **FriendsBook Key**.

---

## 🚀 Features

### 🔐 Authentication & Security
- **Email-based login** and **Google OAuth 2.0** login.
- **OTP-based registration** for verifying email during signup.
- **FriendsBook Key** – an optional 6-digit code for an **extra layer of security**:
  - If activated, users must enter their FriendsBook Key after login to access their account.
  - If not activated, normal login flow applies.

### 📢 Social Features
- Create posts with **text**, **media**, or both.
- Like and comment on posts.
- Get a shareable link for each post
- Follow and unfollow other users.
- **Mutual followers** are automatically treated as friends.

### 💬 Real-Time Messaging
- **Socket.io** powered instant messaging between friends.
- Live chat updates without page refresh.

### 👤 Profile Management
- Create and manage personal profiles with details.
- Upload profile pictures

### 📂 Post & Interaction Management
- Store user posts, saved posts, and liked posts.
- Full support for **media uploads** (images/videos) with **Cloudinary** storage.

### 📝 Feedback System
- Users can submit feedback about the website for improvement.

---

## 🛠 Tech Stack

**Frontend:**
- React.js (Vite)
- Zustand (State Management)
- Socket.io Client
- Tailwind CSS

**Backend:**
- Node.js & Express.js
- MongoDB (Mongoose)
- Socket.io
- Cloudinary SDK
- Nodemailer (for OTP emails)
- JWT (JSON Web Token) Authentication

---

## 📦 Installation

### 1️⃣ Clone the repository
```bash
git clone https://github.com/your-username/friendsbook.git
cd friendsbook
```

### 2️⃣ Install dependencies
**Backend:**
```bash
cd backend
npm install
```
**Frontend:**
```bash
cd frontend
npm install
```

### 3️⃣ Set up environment variables

Create a `.env` file in the `backend/` directory:
```env
PORT=7000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret

# Cloudinary Config
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# Nodemailer OTP / Feedback Email
EMAIL_USER=your_email_address
EMAIL_PASS=your_email_password_or_app_specific_password
```

Create a `.env` file in the `frontend/` directory:
```env
VITE_BACKEND_URL=http://localhost:7000
VITE_GOOGLE_CLIENT_ID=your_google_client_id
```

### 4️⃣ Run the application
**Backend:**
```bash
cd backend
npm start
```
**Frontend:**
```bash
cd frontend
npm run dev
```

---

## 📂 Project Structure
```
friendsbook/
├── backend/         
├── frontend/               
└── README.md
```

---

## 🖥 Usage
1. Register via email (with OTP verification) or Google OAuth.
2. (Optional) Activate **FriendsBook Key** for added login security.
3. Create posts, like, comment, follow/unfollow friends.
4. Chat in real time with mutual friends.
5. Edit your profile and upload media.
6. Submit feedback through the feedback form.

---

## ⚠️ Notes
- Media is stored on **Cloudinary**, so you must configure your account and API keys.
- OTP emails require valid SMTP configuration.
- Ensure **MongoDB** is running locally or use a cloud service like MongoDB Atlas.


