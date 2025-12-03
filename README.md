# 🧠 MindMate - AI-Powered Mental Wellness Companion

<div align="center">

![MindMate Logo](public/logo.png)

**Your personal AI therapist and mental wellness tracking platform**

[![React](https://img.shields.io/badge/React-18.3-61DAFB?style=for-the-badge&logo=react&logoColor=white)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-7.2-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Google AI](https://img.shields.io/badge/Gemini_AI-2.5-4285F4?style=for-the-badge&logo=google&logoColor=white)](https://ai.google.dev/)

[Live Demo](#) • [Features](#-features) • [Installation](#-installation) • [Tech Stack](#-tech-stack)

</div>

---

## 📖 About

MindMate is a comprehensive mental wellness platform that combines AI-powered therapy conversations with mood tracking, journaling, and wellness exercises. Built with modern web technologies, it provides a safe space for users to explore their emotions, track their mental health journey, and receive personalized AI-generated insights.

## ✨ Features

### 🤖 AI Therapy Chat
- Real-time conversations with an empathetic AI therapist
- Context-aware responses powered by Google Gemini AI
- Conversation history and session management
- Mood detection from chat messages

### 📊 Mood Tracking
- Daily mood check-ins with visual tracking
- AI-powered mood detection from text descriptions
- Historical mood charts and trends
- Personalized recommendations based on mood patterns

### 😊 Facial Expression Recognition
- Real-time emotion detection using webcam
- AI-powered facial analysis using transformers.js
- Automatic mood logging from detected expressions
- Privacy-focused (all processing done locally in browser)

### 📝 Journaling
- Daily journal entries with mood tagging
- AI-generated prompts for reflection
- Searchable journal history
- Export capabilities

### 🧘 Wellness Hub
- Guided breathing exercises (Box Breathing, 4-7-8, etc.)
- Meditation timers
- Wellness goal setting and tracking
- Daily affirmations

### 📈 Insights & Reports
- Comprehensive mood analytics dashboard
- AI-generated wellness insights
- **PDF Report Generation** with:
  - Mood statistics and trends
  - Visual mood breakdown charts
  - Recent mood entries
  - Personalized AI recommendations
- Chat and journal correlation analysis

### 🎨 Modern UI/UX
- Clean, accessible interface with shadcn/ui components
- Dark/Light mode support
- Responsive design for all devices
- Smooth animations with Framer Motion

## 🛠 Tech Stack

### Frontend
- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool
- **TailwindCSS** - Styling
- **shadcn/ui** - Component library
- **Framer Motion** - Animations
- **Recharts** - Data visualization
- **transformers.js** - Browser-based ML for emotion detection

### Backend
- **Node.js** - Runtime
- **Express** - API framework
- **Google Gemini AI** - AI/LLM capabilities
- **PDFKit** - PDF generation
- **Firebase** - Authentication

### Development
- **ESLint** - Linting
- **PostCSS** - CSS processing

## 🚀 Installation

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Google AI API key (for Gemini)

### Setup

1. **Clone the repository**
```bash
git clone https://github.com/IshaanSharma10/visually-alike-build.git
cd visually-alike-build
```

2. **Install frontend dependencies**
```bash
npm install
```

3. **Install backend dependencies**
```bash
cd server
npm install
```

4. **Configure environment variables**

Create `.env` file in the `server` directory:
```env
GOOGLE_API_KEY=your_gemini_api_key_here
PORT=5001
```

5. **Start the backend server**
```bash
cd server
npm start
```

6. **Start the frontend development server**
```bash
# In the root directory
npm run dev
```

7. **Open your browser**
```
http://localhost:8080
```

## 📁 Project Structure

```
mindmate/
├── public/                 # Static assets
├── server/                 # Backend server
│   ├── server.js          # Express server with API routes
│   ├── package.json       # Backend dependencies
│   └── uploads/           # File uploads directory
├── src/
│   ├── assets/            # Images and static files
│   ├── components/        # Reusable UI components
│   │   ├── ui/           # shadcn/ui components
│   │   └── Header.tsx    # Navigation header
│   ├── pages/            # Page components
│   │   ├── Chat.tsx      # AI therapy chat
│   │   ├── MoodTracker.tsx
│   │   ├── FacialExpression.tsx
│   │   ├── Journal.tsx
│   │   ├── Wellness.tsx
│   │   ├── Insights.tsx
│   │   └── Settings.tsx
│   ├── App.tsx           # Main app with routing
│   ├── FirebaseConfig.ts # Firebase configuration
│   └── main.tsx          # Entry point
├── package.json          # Frontend dependencies
└── README.md
```

## 🔌 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/chat` | POST | Send message to AI therapist |
| `/api/moods` | POST | Save mood entry |
| `/api/moods/:userId` | GET | Get user's mood history |
| `/api/detect-mood` | POST | AI mood detection from text |
| `/api/mood-patterns/:userId` | GET | Get mood analytics |
| `/api/mood-report/:userId` | GET | Generate PDF wellness report |
| `/api/journal` | POST | Save journal entry |
| `/api/journal/:userId` | GET | Get journal entries |
| `/api/insights/:userId` | GET | Get AI-generated insights |

## 🎯 Key Features Explained

### AI Mood Detection
The app uses a sophisticated mood detection system that:
1. Analyzes text for emotion keywords and phrases
2. Uses Google Gemini AI for context-aware detection
3. Considers common life events (e.g., "bought a new car" → happy)
4. Falls back to keyword matching if AI is unavailable

### PDF Report Generation
Generate comprehensive wellness reports including:
- Visual mood statistics with colored indicators
- Progress bars showing mood distribution
- Recent mood entry timeline
- AI-generated personalized insights and recommendations

### Facial Expression Recognition
- Uses transformers.js with Hugging Face models
- Runs entirely in the browser (privacy-first)
- Detects: Happy, Sad, Angry, Fear, Disgust, Surprise, Neutral
- Can automatically log detected moods

## 🔒 Privacy & Security

- **Local Processing**: Facial expression analysis runs entirely in your browser
- **Firebase Auth**: Secure authentication
- **No Data Sharing**: Your personal data stays with you
- **Encrypted Storage**: Sensitive data is encrypted

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the ISC License.

## 👨‍💻 Author

**Ishaan Sharma**
- GitHub: [@IshaanSharma10](https://github.com/IshaanSharma10)

## 🙏 Acknowledgments

- [Google Gemini AI](https://ai.google.dev/) for AI capabilities
- [shadcn/ui](https://ui.shadcn.com/) for beautiful UI components
- [Hugging Face](https://huggingface.co/) for ML models
- [Lucide Icons](https://lucide.dev/) for icons

---

<div align="center">

**If you find this project helpful, please consider giving it a ⭐**

Made with ❤️ for mental wellness

</div>
