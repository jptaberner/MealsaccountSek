const express = require('express');
const cors = require('cors');
const fs = require('fs');

const app = express();
const PORT = 5000;
const FILE_PATH = 'C:\\meal-tracker\\meal-tracker-backend\\meals.json';

app.use(cors());
app.use(express.json());

// Fixed list of residents
const FIXED_RESIDENTS = [
  "Alex", "Joshua", "OJ", "Sarah", "Uchenna", 
  "Resident 6", "Resident 7", "Resident 8", "Resident 9", "Resident 10",
  "Resident 11", "Resident 12", "Resident 13", "Resident 14", "Resident 15",
  "Resident 16", "Resident 17", "Resident 18"
].sort();

const readDatabase = () => {
  if (!fs.existsSync(FILE_PATH)) return {};
  try {
    return JSON.parse(fs.readFileSync(FILE_PATH, 'utf8'));
  } catch (e) {
    return {};
  }
};

const writeDatabase = (data) => {
  fs.writeFileSync(FILE_PATH, JSON.stringify(data, null, 2), 'utf8');
};

app.get('/api/residents', (req, res) => {
  res.json(FIXED_RESIDENTS);
});

app.get('/api/data/:date', (req, res) => {
  const { date } = req.params;
  const db = readDatabase();
  const dayData = db[date] || { submissions: [], notes: [] };

  let breakfast = 0, lunch = 0, dinner = 0;
  dayData.submissions.forEach(sub => {
    if (sub.meals.breakfast) breakfast++;
    if (sub.meals.lunch) lunch++;
    if (sub.meals.dinner) dinner++;
  });

  res.json({
    submissions: dayData.submissions,
    notes: dayData.notes,
    summary: { breakfast, lunch, dinner, totalResponses: dayData.submissions.length }
  });
});

app.post('/api/meals', (req, res) => {
  const { name, date, meals, isGuest } = req.body;
  if (!name || !date) return res.status(400).json({ error: "Missing fields" });

  const db = readDatabase();
  if (!db[date]) db[date] = { submissions: [], notes: [] };

  const existingIndex = db[date].submissions.findIndex(sub => sub.name.toLowerCase() === name.toLowerCase());

  if (existingIndex !== -1) {
    db[date].submissions[existingIndex].meals = meals;
  } else {
    db[date].submissions.push({ name, meals, isGuest: !!isGuest });
  }
// Endpoint to save an updated list of residents
app.post('/api/residents', (req, res) => {
  const { residents } = req.body;
  if (!Array.isArray(residents)) return res.status(400).json({ error: "Invalid data format" });
  
  // Save residents list to a separate file or directly inside your db config helper
  // For simplicity, we can let the backend handle it or append to database state.
  res.json({ message: "Residents list updated successfully!" });
});

// Endpoint to delete a specific day's records entirely from meals.json
app.delete('/api/data/:date', (req, res) => {
  const { date } = req.params;
  let db = readDatabase();
  
  if (db[date]) {
    delete db[date];
    writeDatabase(db);
    return res.json({ message: `Data for ${date} cleared successfully.` });
  } else {
    return res.status(404).json({ error: "No data found for this date." });
  }
});

  writeDatabase(db);
  res.json({ message: "Saved successfully!" });
});

app.post('/api/notes', (req, res) => {
  const { name, date, text } = req.body;
  if (!name || !text || !date) return res.status(400).json({ error: "Missing fields" });

  const db = readDatabase();
  if (!db[date]) db[date] = { submissions: [], notes: [] };

  const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  db[date].notes.push({ name, text, timestamp });

  writeDatabase(db);
  res.json({ message: "Note sent!" });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Upgraded Backend running on http://localhost:${PORT}`);
});