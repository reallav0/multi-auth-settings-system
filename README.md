# Multi-Auth & User Settings System (Commissions)

A complete authentication backend built with **Node.js**, **Express**, **Passport**, and **MongoDB** — featuring both **local login** and **multi-provider OAuth** (Google, Facebook, Discord, Twitter).
Includes secure **JWT-based sessions**, cookie handling, and a full **user settings API** for updating profile information.

> 🧩 Designed to integrate into larger projects like e-commerce or social web apps.

---

## ✨ Features

### 🔐 Authentication

* Local email/password registration and login
* OAuth login with **Google**, **Facebook**, **Discord**, and **Twitter**
* Automatic account creation for new social logins
* Token-based authentication with JWT
* Secure cookie storage (`httpOnly`, `sameSite`, `secure`)

### ⚙️ Settings Management

* Update **bio**, **username**, **email**, **birthdate**, and **profile picture**
* Change password with old-password verification
* Handles duplicate username/email checks
* JWT middleware for route protection

### 🧠 Modular Architecture

* Routes are split by purpose: `/auth` for login/register, `/settings` for updates
* Reusable database functions (e.g. `registerUser`, `getUserData`, `updateUser`)
* Easy to plug into existing Express projects

---

## 🧩 Tech Stack

| Layer         | Technology                               |
| ------------- | ---------------------------------------- |
| Backend       | Node.js, Express.js                      |
| Auth          | Passport.js, JWT                         |
| Database      | MongoDB, Mongoose                        |
| Security      | bcrypt.js, cookie-parser, dotenv         |
| Social Logins | Google, Facebook, Discord, Twitter OAuth |
| Utilities     | axios, querystring                       |

---

## 🛠️ Setup

1. **Clone the repo**

   ```bash
   git clone https://github.com/ReallAv0/multi-auth-settings-system.git
   cd multi-auth-settings-system
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Environment variables**
   Create a `.env` file:

   ```env
   PORT=3080
   MONGO_URI=your_mongo_connection
   JWT_SECRET=your_jwt_secret

   # OAuth credentials
   GOOGLE_CLIENT_ID=...
   GOOGLE_CLIENT_SECRET=...
   FACEBOOK_CLIENT_ID=...
   FACEBOOK_CLIENT_SECRET=...
   DISCORD_CLIENT_ID=...
   DISCORD_CLIENT_SECRET=...
   TWITTER_CONSUMER_KEY=...
   TWITTER_CONSUMER_SECRET=...
   ```

4. **Run the app**

   ```bash
   node index.js
   ```

   The API will run on `http://localhost:3080`.

---

## 🔌 API Overview

### 🧾 Auth Routes

| Route                   | Method | Description               |
| ----------------------- | ------ | ------------------------- |
| `/api/register`         | POST   | Register local account    |
| `/api/login`            | POST   | Login with email/password |
| `/api/google`           | GET    | Start Google OAuth        |
| `/api/google/callback`  | GET    | Google OAuth callback     |
| `/api/facebook`         | GET    | Start Facebook OAuth      |
| `/api/discord/callback` | GET    | Discord OAuth callback    |
| `/api/twitter/callback` | GET    | Twitter OAuth callback    |

All successful logins create a **secure cookie token** and redirect the user.

---

### ⚙️ Settings Routes

All settings routes require JWT authentication (via `req.cookies.token`).

| Route                    | Method | Description                |
| ------------------------ | ------ | -------------------------- |
| `/update-bio`            | POST   | Update user bio            |
| `/update-username`       | POST   | Change username            |
| `/update-password`       | POST   | Change password            |
| `/update-email`          | POST   | Change email               |
| `/update-birthdate`      | POST   | Update birthdate           |
| `/update-profilepicture` | POST   | Change profile picture URL |

---

## 🔒 Security Notes

* Passwords are hashed with **bcrypt** before saving.
* Tokens are signed with **JWT** and stored as `httpOnly` cookies.
* The server uses `sameSite=Lax` and enforces HTTPS in production.

---

## 🧠 Integration Ideas

* Connect this backend with a **Next.js** or **React** frontend for the login & settings pages.
* Extend user data with roles (admin, seller, buyer).
* Combine with your **in-game item eCommerce backend** for a unified auth system.

---

## 📜 License

MIT License © 2025 ReallAv0
