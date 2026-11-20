# ♠ Emerald Club

**Full-Stack Casino-Style Gaming Platform**

A personal pet project focused on building an interactive gaming platform with a modern frontend, REST API, persistent player progress, and server-side game logic.

[**🎮 Live Demo**](https://emerald-club.vercel.app) · [**💻 Source Code**](https://github.com/scRelic/Emerald-Club)

---

## ✨ Features

- 🎲 Multiple games: Poker, Blackjack, Roulette, Dice, and Fortune
- 👤 User registration and authentication
- 💰 Virtual chip balance and game progress
- 🃏 Server-side game logic and result calculation
- 🏆 Player achievements and statistics
- 🎨 Responsive interface with Tailwind CSS
- 💾 Persistent data storage with PostgreSQL

## 🛠 Tech Stack

| Frontend | Backend | Database & Deployment |
|---|---|---|
| Vue 3 | Node.js | PostgreSQL |
| Vite | Express.js | Neon |
| Pinia | REST API | Vercel |
| Tailwind CSS | Session Authentication | Render |

## 📸 Screenshots

### 🏠 Homepage
![Emerald Club Homepage](docs/screenshots/Main%20View.png)

### 🎮 Games
![Games Catalog](docs/screenshots/Game%20View.png)

### 🃏 Blackjack
![Blackjack Game](docs/screenshots/Blackjack%20View.png)

### 🎡 Roulette
![Roulette Game](docs/screenshots/Roulette%20View.png)

### 👤 Profile
![Player Profile](docs/screenshots/Profile%20View.png)

### 📜 Rules
![Game Rules](docs/screenshots/Rules%20View.png)

### 🛍️ Shop
![Emerald Club Shop](docs/screenshots/Shop%20View.png)


## 🏗️ Architecture

Emerald Club follows a client-server architecture.

**Frontend**
- Vue 3 for building the user interface
- Pinia for state management
- Vue Router for navigation
- Tailwind CSS for responsive design

**Backend**
- Node.js and Express.js
- REST API for client-server communication
- Server-side game logic
- Authentication and session management

**Database**
- PostgreSQL for persistent data storage
- Player profiles, balances, and game sessions

**Deployment**
- Frontend: Vercel
- Backend: Render
- Database: Neon PostgreSQL

---

## 🧠 Technical Challenges

### 🎲 Server-Side Game Logic
Implemented game logic on the backend to ensure that
game results are processed on the server rather than
trusted from the client.

### 🃏 Poker Session Management
Implemented persistent poker sessions to allow players
to restore their game state after refreshing the page.

### 🔐 Authentication
Implemented session-based authentication using cookies
and backend authorization checks.

### 📱 Responsive UI
Built a responsive interface for desktop, tablet,
and mobile devices using Tailwind CSS.

## 🚀 Getting Started

Clone the repository:

```bash
git clone https://github.com/scRelic/Emerald-Club.git
cd Emerald-Club
```

Install frontend dependencies:

```bash
npm install
```

Install backend dependencies:

```bash
cd server
npm install
```

Configure the required environment variables using the example environment files.

Start the frontend:

```bash
npm run dev
```

Start the backend from the `server` directory:

```bash
npm run dev
```

## 🧪 Testing

The project includes automated tests for game logic and backend functionality.

Run the relevant test scripts from the project directories.

## 📌 Project Status

**In active development**

Current priorities include improving game mechanics, refining the responsive UI, and expanding automated testing.

## ⚠️ Disclaimer

Emerald Club is an educational pet project using virtual chips. It is not a real-money gambling platform.

---

**Built as a personal full-stack development project.**
