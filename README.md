# 🧠 StudyBuddy

> **"NotebookLM helps you study - StudyBuddy makes sure you actually understand."**

---

## 🚀 Overview

StudyBuddy is an AI-powered learning system that evaluates how **deeply** a student understands a concept, not just whether they can produce a correct answer.

Instead of passive learning through summaries, StudyBuddy creates an **interactive feedback loop** that challenges thinking, detects weaknesses, and actively improves learning.

---

## 💡 The Problem

Today's students rely heavily on AI tools to:
- Summarize notes
- Generate answers
- Explain concepts

But there's a major gap:

> ❗ **Students can get the right answer without truly understanding it.**

This leads to:
- Surface-level learning
- Poor retention
- Weak problem-solving skills

---

## ✨ Our Solution

StudyBuddy transforms learning into an **active, adaptive process**.

It doesn't just give answers — it:
- ✅ Evaluates your thinking
- ✅ Challenges your understanding
- ✅ Identifies your weak areas
- ✅ Guides you to improve

---

## 🔥 Key Features

### 🔍 Reasoning Challenge *(Core Feature)*
- Two students answer the same question
- AI compares both responses
- Evaluates: **Correctness · Reasoning Depth · Clarity**
- Reveals: 👉 *"Same answer, different depth"*

### 🧠 Socratic Cross-Examination
- AI asks follow-up questions targeting weak points
- Mimics interviews and oral exams
- Forces students to defend their answers
- Provides verdict:
  - ✅ Gap closed
  - ⚠️ Partial understanding
  - ❌ Study this more

### 📊 Concept Gap Detection
- Identifies exactly what the student doesn't understand
- Labels gaps like:
  - *Surface-level understanding*
  - *Lacks causal reasoning*
- Tracks weaknesses over time

### 📅 Adaptive Study Schedule
- Generates a personalized study plan
- Focuses on weak areas
- Updates dynamically based on performance

### 📈 Performance Report & Ranking
- Provides strengths & weaknesses
- Readiness score & topic coverage
- Comparative ranking

---

## 🆚 What Makes StudyBuddy Unique?

| Feature | Traditional Tools | StudyBuddy |
|---|---|---|
| Summarization | ✅ | ❌ |
| Checks correctness | ❌ | ✅ |
| Evaluates reasoning depth | ❌ | ✅ |
| Detects misconceptions | ❌ | ✅ |
| Challenges thinking | ❌ | ✅ |
| Adaptive learning loop | ❌ | ✅ |

> 👉 **StudyBuddy focuses on *how* you think, not just *what* you know.**

---

## 🧩 How It Works

```
Answer → Evaluate → Detect Gaps → Challenge → Improve
```

1. Student answers a question
2. AI evaluates reasoning depth
3. Weak areas are identified
4. AI challenges with follow-up questions
5. Student defends answer
6. AI evaluates again
7. Personalized study plan is generated

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React + TypeScript + Vite |
| Backend | Node.js / Express (or Vercel Functions) |
| AI | Claude API (Anthropic) |
| State Management | Zustand |

---

## ⚙️ Setup & Installation

**1. Clone the repository**
```bash
git clone https://github.com/MansiSuryawanshi/StudyBuddy.git
cd StudyBuddy
```

**2. Install dependencies**
```bash
npm install
```

**3. Setup environment variables**

Frontend `.env`:
```env
VITE_API_BASE_URL=http://localhost:3001
```

Backend `.env`:
```env
ANTHROPIC_API_KEY=your_api_key_here
```

**4. Run the project**

Frontend:
```bash
npm run dev
```

Backend:
```bash
node server.js
```

---

## 🧪 Demo Flow

1. Answer a question
2. Compare responses
3. See reasoning depth analysis
4. Get challenged with follow-up questions
5. Receive personalized study plan
6. Track readiness score and ranking

---

## 📚 What We Learned

- Designing AI prompts for structured reasoning evaluation
- Building secure AI integrations
- Creating interactive AI experiences
- Understanding the difference between **generating** vs **evaluating** answers

---

## ⚡ Challenges We Faced

- Ensuring consistent JSON responses from AI
- Designing prompts to detect reasoning depth
- Managing multi-step UI state
- Building smooth UX with animations

---

## 🌟 Why It Matters

Most students memorize — few truly understand.

StudyBuddy changes that by:
- Encouraging deep thinking
- Identifying real conceptual gaps
- Providing actionable improvement

---

## 🔮 Future Improvements

- [ ] Real-time collaboration
- [ ] Advanced ranking systems
- [ ] LMS integrations
- [ ] Voice-based AI assistant

---

## 👥 Team

Built with ❤️ at a hackathon

---

## 🏆 Vision

> To build an AI system that doesn't just assist learning — but actively improves **how people think**.

---

> 🔥 **"Learning isn't about getting the right answer, it's about understanding *why* it's right."**
