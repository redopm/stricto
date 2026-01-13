# 🛡️ Stricto - Mission Ops

<div align="center">

![Stricto Logo](icon-192.png)

**AI-Powered Study Protocol System for Competitive Exam Aspirants**

[![PWA Ready](https://img.shields.io/badge/PWA-Ready-success?style=flat-square)](https://web.dev/progressive-web-apps/)
[![Firebase](https://img.shields.io/badge/Firebase-Hosting-orange?style=flat-square)](https://firebase.google.com/)
[![Python](https://img.shields.io/badge/Python-3.12-blue?style=flat-square)](https://www.python.org/)
[![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)

[Live Demo](#) • [Documentation](#features) • [Report Bug](#)

</div>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Getting Started](#-getting-started)
- [Deployment](#-deployment)
- [Project Structure](#-project-structure)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🎯 Overview

**Stricto** is an intelligent study management system designed specifically for competitive exam preparation (SSC, Banking, UPSC, etc.). It combines AI-powered task generation with gamification to create a disciplined, data-driven study routine.

### Why Stricto?

- **🧠 AI Brain Engine**: Analyzes your strengths/weaknesses and generates personalized daily study protocols
- **📊 Performance Analytics**: Track progress with heatmaps, velocity charts, and skill radars
- **🎮 Gamification**: Earn points, unlock badges, and redeem rewards
- **📱 PWA Support**: Install as a native app on any device
- **🌙 Dark Theme**: Cyberpunk-inspired UI optimized for long study sessions

---

## ✨ Features

### 🧬 Intelligent Task Generation
- **Adaptive Difficulty**: Automatically adjusts based on your skill level (Beginner/Intermediate/Advanced)
- **Exam Proximity Logic**: Shifts strategy as exam date approaches (Far/Near/Critical phases)
- **Subject Balancing**: Ensures weak subjects get priority while maintaining strong ones
- **Time-Based Protocols**: Dynamic greetings (Morning/Afternoon/Evening Protocol)

### � Analytics Dashboard
- **GitHub-Style Heatmaps**: Visualize daily activity across subjects
- **Skill Radar Chart**: Multi-dimensional view of your strengths
- **Weekly Velocity**: Track completion trends over time
- **DNA Sliders**: Real-time skill level indicators

### 🏆 Gamification System
- **Points Economy**: Earn points for task completion
- **Achievement Badges**: Unlock milestones (10 tasks, 50 tasks, 7-day streak, etc.)
- **Reward Store**: Redeem points for courses, vouchers, or cash prizes
- **Leaderboard**: Compete with other aspirants (coming soon)

### 🔔 Smart Features
- **Browser Notifications**: Get alerted when new tasks are generated
- **Share Functionality**: Share your progress via native share API
- **Offline Support**: Service Worker caching for offline access
- **Responsive Design**: Optimized for desktop, tablet, and mobile

### 🎨 Premium UI/UX
- **Glassmorphism**: Modern frosted-glass aesthetic
- **Gradient Scrollbars**: Theme-matched custom scrollbars
- **Smooth Animations**: Micro-interactions for better engagement
- **Neon Accents**: Toxic green (#0aff68) and cyber blue (#00f0ff) palette

---

## 🛠️ Tech Stack

### Frontend
- **Core**: HTML5, Vanilla JavaScript (ES6 Modules)
- **Styling**: CSS3 with CSS Variables, Flexbox, Grid
- **Icons**: Ionicons
- **Charts**: Chart.js
- **Storage**: LocalStorage + Firebase Firestore

### Backend
- **Runtime**: Python 3.12
- **Framework**: Flask
- **AI Engine**: Custom algorithm (brain_engine.py)
- **Libraries**: Pandas, NumPy
- **Server**: Gunicorn

### Infrastructure
- **Frontend Hosting**: Firebase Hosting
- **Backend Hosting**: Render.com
- **Database**: Firebase Firestore
- **Authentication**: Firebase Auth

---

## 🚀 Getting Started

### Prerequisites
- Node.js 16+ (for Firebase CLI)
- Python 3.12+
- Firebase account
- Git

### Local Development

#### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/stricto.git
cd stricto
```

#### 2. Setup Frontend
```bash
# Install Firebase CLI (if not already installed)
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize Firebase (select Hosting)
firebase init

# Serve locally
firebase serve
```

Open `http://localhost:5000` in your browser.

#### 3. Setup Backend
```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run development server
python server.py
```

Backend runs on `http://localhost:5000` (Flask default).

#### 4. Configure API URL
Update `dashboard.js` line ~118:
```javascript
const DEV_URL = 'http://localhost:5000';  // Local backend
const PROD_URL = 'https://your-backend.onrender.com';  // Production
```

---

## 📦 Deployment

### Frontend (Firebase Hosting)
```bash
firebase deploy
```

### Backend (Render.com)
1. Push backend to GitHub
2. Create new Web Service on Render
3. Connect GitHub repo
4. Set build command: `pip install -r requirements.txt`
5. Set start command: `gunicorn server:app`
6. Deploy!

For detailed deployment instructions, see [deployment_guide.md](deployment_guide.md).

---

## 📁 Project Structure

```
stricto/
├── backend/
│   ├── brain_engine.py      # AI task generation logic
│   ├── server.py             # Flask API endpoints
│   ├── requirements.txt      # Python dependencies
│   └── test_brain.py         # Unit tests
├── css/
│   ├── styles.css            # Global styles
│   ├── mobile.css            # Mobile-specific styles
│   └── desktop.css           # Desktop-specific styles
├── js/
│   ├── app.js                # Firebase config & auth
│   ├── dashboard.js          # Main dashboard logic
│   ├── analytics.js          # Analytics page logic
│   ├── achievements.js       # Gamification logic
│   └── settings.js           # Settings page logic
├── dashboard.html            # Main app page
├── analytics.html            # Performance analytics
├── achievements.html         # Badges & rewards
├── settings.html             # User preferences
├── login.html                # Authentication
├── manifest.json             # PWA manifest
├── sw.js                     # Service Worker
├── icon-192.png              # PWA icon (192x192)
├── icon-512.png              # PWA icon (512x512)
├── favicon.png               # Browser favicon
└── README.md                 # This file
```

---

## 🎮 Usage Guide

### First-Time Setup
1. **Create Account**: Sign up with email/password
2. **Complete DNA Setup**: 
   - Select exam goal (SBI PO, SSC CGL, etc.)
   - Set exam date
   - Choose exam stage (Prelims/Mains)
   - Rate your skill levels (Math, Reasoning, English, GA)
   - Select study level (Beginner/Intermediate/Advanced)

### Daily Workflow
1. **Generate Protocol**: Click "Generate Daily Protocol"
2. **Complete Tasks**: Check off tasks as you finish
3. **Submit Proof**: Provide verification (key concepts, screenshots, etc.)
4. **Track Progress**: View analytics and heatmaps
5. **Earn Rewards**: Collect points and unlock badges

### Key Features
- **Pomodoro Timer**: Built-in 25-minute focus timer (sidebar)
- **Leave System**: Apply for study breaks when needed
- **Share Progress**: Share your achievements via native share
- **Notifications**: Get alerts for new task generation

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👨‍💻 Author

**Omprakash Maury**

- GitHub: [@omprakashmaury](https://github.com/omprakashmaury)
- Email: omprakashmaury001@gmail.com

---

## 🙏 Acknowledgments

- Ionicons for beautiful icons
- Chart.js for data visualization
- Firebase for backend infrastructure
- Render.com for backend hosting

---

<div align="center">

**Built with ❤️ for competitive exam aspirants**

⭐ Star this repo if you find it helpful!

</div>
