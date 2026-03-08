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

import fs from 'fs';

// File path for storing poll stats
const DATA_FILE = path.join(__dirname, 'statistics.json');
const IPS_DIR = path.join(__dirname, 'voted_ips');

// Initialize IPs directory
if (!fs.existsSync(IPS_DIR)) {
  fs.mkdirSync(IPS_DIR);
}

// Default Polling Data Form
const defaultPollData = {
  question: "Jaký je váš nejoblíbenější programovací jazyk?",
  options: [
    { id: 'a', text: "JavaScript / TypeScript", votes: 0 },
    { id: 'b', text: "Python", votes: 0 },
    { id: 'c', text: "C# / Java", votes: 0 },
    { id: 'd', text: "PHP / SQL", votes: 0 }
  ]
};

// Initialize or Load Poll Data
let pollData = { ...defaultPollData };
if (fs.existsSync(DATA_FILE)) {
  try {
    const rawData = fs.readFileSync(DATA_FILE, 'utf-8');
    pollData = { ...defaultPollData, ...JSON.parse(rawData) };
    if (pollData.adminToken) delete pollData.adminToken;
    if (pollData.votedIps) delete pollData.votedIps; // Remove legacy array
  } catch (err) {
    console.error('Error reading stats file', err);
  }
}

// Function to save stats map to file
const savePollStats = () => {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(pollData, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing stats file', err);
  }
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
  const userIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
  const ipFile = path.join(IPS_DIR, userIp.replace(/[^a-zA-Z0-9.-]/g, '_'));

  const hasVoted = req.cookies.voted === 'true' || fs.existsSync(ipFile);
  res.json({ ...pollData, hasVoted, adminToken: undefined });
});

app.post('/api/vote', (req, res) => {
  const { optionId } = req.body;
  const userIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
  const ipFile = path.join(IPS_DIR, userIp.replace(/[^a-zA-Z0-9.-]/g, '_'));

  if (req.cookies.voted === 'true' || fs.existsSync(ipFile)) {
    return res.status(403).json({ message: "Již jste hlasovali." });
  }

  const option = pollData.options.find(o => o.id === optionId);
  if (!option) {
    return res.status(404).json({ message: "Možnost nenalezena." });
  }

  option.votes += 1;
  fs.writeFileSync(ipFile, ''); // Create empty file to mark IP as voted
  savePollStats();

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

  if (token !== process.env.ADMIN_TOKEN) {
    return res.status(403).json({ message: "Neplatný token pro reset." });
  }

  pollData.options.forEach(o => o.votes = 0);

  // Clear all IP files
  try {
    const files = fs.readdirSync(IPS_DIR);
    for (const file of files) {
      fs.unlinkSync(path.join(IPS_DIR, file));
    }
  } catch (err) {
    console.error('Error clearing IPs directory', err);
  }

  savePollStats();
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
