import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import cookieParser from 'cookie-parser';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Poll Data (In-Memory)
let pollData = {
  question: "Jaký je váš nejoblíbenější programovací jazyk?",
  options: [
    { id: 'a', text: "JavaScript / TypeScript", votes: 0 },
    { id: 'b', text: "Python", votes: 0 },
    { id: 'c', text: "C# / Java", votes: 0 },
    { id: 'd', text: "PHP / SQL", votes: 0 }
  ],
  adminToken: "secret123" // Hardcoded token for reset
};

// Middleware
app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// Serve static files from the Vite build directory
app.use(express.static(path.join(__dirname, '../dist')));

// API Routes
app.get('/api/poll', (req, res) => {
  const hasVoted = req.cookies.voted === 'true';
  res.json({ ...pollData, hasVoted, adminToken: undefined });
});

app.post('/api/vote', (req, res) => {
  const { optionId } = req.body;

  if (req.cookies.voted === 'true') {
    return res.status(403).json({ message: "Již jste hlasovali." });
  }

  const option = pollData.options.find(o => o.id === optionId);
  if (!option) {
    return res.status(404).json({ message: "Možnost nenalezena." });
  }

  option.votes += 1;

  // Set cookie for 1 year
  res.cookie('voted', 'true', {
    maxAge: 365 * 24 * 60 * 60 * 1000,
    httpOnly: false, // Accessible by frontend to check state
    sameSite: 'lax'
  });

  res.json({ success: true, options: pollData.options });
});

app.post('/api/reset', (req, res) => {
  const { token } = req.body;

  if (token !== pollData.adminToken) {
    return res.status(403).json({ message: "Neplatný token pro reset." });
  }

  pollData.options.forEach(o => o.votes = 0);
  res.json({ success: true, message: "Hlasování bylo resetováno.", options: pollData.options });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Fallback route to serve the frontend (for client-side routing)
app.use((req, res) => {
  res.sendFile(path.join(__dirname, '../dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
