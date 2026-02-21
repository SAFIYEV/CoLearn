# CoLearn - AI-Powered Competitive Learning Platform

CoLearn is an AI-powered learning platform that generates fully personalized courses and turns education into a competitive game. It features Skill Arena with AI duels and boss fights, a contextual AI tutor, gamification with XP and badges, PDF export, certificates, and social learning — all powered by Google Gemini API with zero backend.

## Features

- **AI Course Generation** — Full personalized course in under 3 minutes: modules, lessons, quizzes
- **Skill Arena** — AI Duels with HP bars, combo streaks, and real-time scoring against AI bots
- **Boss Fight** — Defend your knowledge against an AI examiner in conversational combat
- **AI Tutor** — Context-aware help built into every lesson
- **Gamification** — XP, levels, streaks, badges to keep you coming back
- **PDF Export** — Download any lesson or entire course as a professionally formatted PDF
- **Certificates** — Canvas-rendered downloadable certificates on course completion
- **Social Learning** — Classes, group chat, collaborative features
- **i18n** — Full Russian and English support
- **Themes** — Dark and Light mode
- **Mobile** — Fully responsive design

## Tech Stack

- **Frontend**: React 19 + TypeScript + Vite
- **AI**: Google Gemini API (course generation, chat, tutor, arena, boss fights)
- **Storage**: Local-first (no backend required)
- **PDF**: jsPDF (client-side generation)
- **Certificates**: Canvas API
- **Deploy**: GitHub Pages

## Quick Start

```bash
npm install
npm run dev
```

## Configuration

Create a `.env` file:

```
VITE_GEMINI_API_KEY=your_gemini_key
```

## License

MIT
