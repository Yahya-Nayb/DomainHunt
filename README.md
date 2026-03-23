# 🏹 DomainHunt AI 💎

**DomainHunt AI** is a high-precision intelligence engine designed to deconstruct niches and discover premium, "high-alpha" digital real estate. Built with a **Provider-Agnostic** core, it allows elite domainers to bring their own intelligence engines (BYOK) to hunt for the next million-dollar brand.

![Project Status](https://img.shields.io/badge/Status-In_Development-emerald)
![Methodology](https://img.shields.io/badge/Methodology-Vibe_Coding-blueviolet)
![Architecture](https://img.shields.io/badge/Architecture-Monorepo-orange)

---

## 🚀 The Vision
DomainHunt AI doesn't just "generate names"—it performs semantic deconstruction. It identifies the DNA of a niche (seeds, prefixes, suffixes) and uses advanced AI to rank candidates based on brandability, length, and market appeal.

## 🛠️ Tech Stack & Architecture

This project is a **Full-Stack Monorepo** engineered for speed and scalability:

### **Frontend (Next.js 14+)**
- **UI:** Ultra-Dark Premium interface with Tailwind CSS & Framer Motion.
- **Experience:** Real-time search feedback and glassmorphism design.
- **Security:** Client-side API Key management (BYOK) stored securely in LocalStorage.

### **Backend (NestJS)**
- **Engine:** Modular `ProviderFactory` designed to support **OpenAI**, **Anthropic**, and **Google Gemini**.
- **Logic:** Multi-phase generation (Niche Deconstruction -> Mass Generation -> AI Ranking).
- **Database:** Supabase integration for persistent data handling.

---

## ✨ Key Features
- **Bring Your Own Key (BYOK):** Full control over your AI usage and costs.
- **Multi-Engine Support:** Switch between different AI models to get diverse branding perspectives.
- **Precision Filtering:** Say goodbye to generic names. Get only "Premium-Feel" startup domains.
---

## 📂 Project Structure
```text
DomainHunt/
├── frontend/        # Next.js Application (The Hunter's Console)
├── backend/         # NestJS Server (The Intelligence Hub)
└── README.md        # Project Documentation
```
🛠️ Getting Started

1. Clone the Repository

```bash
git clone [https://github.com/yahya-nayb/domainhunt.git](https://github.com/yahya-nayb/domainhunt.git)
cd domainhunt
```

2. Setup Backend

```bash
cd backend
npm install
# Configure your .env (SUPABASE_URL, SUPABASE_KEY, etc.)
npm run start:dev
```

3. Setup Frontend

```bash
cd ../frontend
npm install
npm run dev
```

👨‍💻 Author
Yahya Nayb – Full Stack Developer.
Specializing in NestJS, Next.js, and AI-Driven Architectures.
