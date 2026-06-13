# J.A.R.V.I.S. // JEE Student Mental Wellness & Academic HUD

J.A.R.V.I.S. (Just A Rather Very Intelligent System) is a premium, full-stack mental wellness companion and academic tracking dashboard designed specifically for students preparing for the Indian IIT JEE exam.

Built with a high-contrast obsidian dark-mode HUD aesthetic, J.A.R.V.I.S. allows students to talk to an empathetic AI mentor while simultaneously tracking their sleep hours, mental stress telemetry, active JEE subject/topic focus, and syllabus mastery in real-time.

---

## ⚡ Core Architecture & Logic

### 1. Stateless Serverless-Ready State Flow
Unlike traditional local database setups that crash in serverless environments:
* **Source of Truth**: The student's state is stored directly in the browser's `localStorage` on the client.
* **Stateless API**: Each user message transmitted to `/api/chat` sends the current state along with it. The API processes the request, applies updates, and returns the modified state back to the client, enabling support for multi-user deployments.

### 2. Single-Step Combined AI Process
To optimize speed and prevent API rate-limit errors, the backend combines extraction and dialogue generation into **one unified Gemini API call** using a structured JSON schema:
1. **Extraction**: Analyzes user statements for sleep reports, mood changes, stress markers, subject focus, and mastered topics.
2. **Empathetic Dialogue**: Generates witty, helpful, Jarvis-themed advice referencing the student's metrics (e.g. warning them about cognitive drop on hard physics modules if sleep is < 6 hours).

### 3. Fail-Safe Quota Fallback
If the Gemini API key runs out of daily requests (which is common on the Gemini Free Tier):
* **Local Heuristic Parser**: Switch automatically to regex pattern parsing to extract sleep duration, subjects, and mastered topics.
* **Scripted Fallback Dialogue**: Generate contextual J.A.R.V.I.S response logs using local heuristics to keep the user's dashboard and session fully functional.

---

## 🛠️ Technology Stack

* **Frontend**: React 19, TypeScript, Tailwind CSS v4, Lucide Icons
* **Backend**: Node.js (Express), Dotenv, CORS
* **AI Engine**: Google GenAI SDK (`gemini-2.5-flash`)
* **Deployment**: Optimized for Vercel Serverless Functions

---

## ⚙️ Local Setup Instructions

### 1. Prerequisites
Ensure you have [Node.js](https://nodejs.org/) installed (v18+ recommended).

### 2. Clone and Setup Environment
Create a `.env` file in the root directory:
```env
GEMINI_API_KEY=your_gemini_api_key_here
PORT=5000
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Run the Application
Start the backend Express server:
```bash
npm run server
```
In a separate terminal, start the Vite client dev server:
```bash
npm run dev
```
Open `http://localhost:5173` in your browser.

---

## ☁️ Vercel Serverless Deployment

This project includes a pre-configured `vercel.json` file. To host it:
1. Push this code to GitHub.
2. Import the repository into your Vercel Dashboard.
3. Vercel will auto-detect Vite. Add `GEMINI_API_KEY` to your project's **Environment Variables**.
4. Click **Deploy**. Vercel will build the React assets and host the backend Express server as a Node.js serverless function under `/api/chat`.
