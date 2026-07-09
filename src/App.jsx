import { useState, useEffect } from 'react';
import './App.css';

export default function App() {
  const [view, setView] = useState('resident');
  const [isDarkMode, setIsDarkMode] = useState(true); // Default to gorgeous OLED dark mode
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  
  const [dayData, setDayData] = useState({ 
    submissions: [], 
    notes: [], 
    summary: { breakfast: 0, lunch: 0, dinner: 0, totalResponses: 0 } 
  });
  
  const [residentList, setResidentList] = useState([
    "Joshua", "OJ", "Fr. Pedro", "Fr. John", "Uchenna", 
    "Barry", "Joseph", "Chidera", "Andrew", "Segun",
    "Chukwudi", "Valentine", "Nonie", "Resident 14", "Resident 15",
    "Resident 16", "Resident 17", "Resident 18"
  ]);

  const [newResidentName, setNewResidentName] = useState('');

  const fetchDayData = async () => {
    try {
      const response = await fetch(`http://192.168.0.168:5000/api/data/${selectedDate}`);
      if (response.ok) {
        const data = await response.json();
        setDayData(data);
      }
    } catch (e) { 
      console.error("Error connecting to backend:", e); 
    }
  };

  useEffect(() => {
    fetchDayData();
  }, [selectedDate, view]);

  const [selectedName, setSelectedName] = useState('');
  const [guestName, setGuestName] = useState('');
  const [isGuest, setIsGuest] = useState(false);
  const [meals, setMeals] = useState({ breakfast: false, lunch: false, dinner: false });
  const [noteText, setNoteText] = useState('');

  useEffect(() => {
    const activeName = isGuest ? guestName : selectedName;
    if (!activeName) {
      setMeals({ breakfast: false, lunch: false, dinner: false });
      return;
    }
    const match = dayData.submissions.find(s => s.name.toLowerCase() === activeName.toLowerCase());
    if (match) {
      setMeals(match.meals);
    } else {
      setMeals({ breakfast: false, lunch: false, dinner: false });
    }
  }, [selectedName, guestName, isGuest, dayData.submissions]);

  const handleMealSubmit = async (e) => {
    e.preventDefault();
    const activeName = isGuest ? guestName : selectedName;
    if (!activeName) return alert("Please select or enter a name.");

    try {
      const res = await fetch('http://192.168.0.168:5000/api/meals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: activeName, date: selectedDate, meals, isGuest })
      });
      if (res.ok) {
        alert("Selection saved successfully!");
        fetchDayData();
        if (isGuest) setGuestName('');
      }
    } catch (err) {
      alert("Error saving selection.");
    }
  };

  const handleNoteSubmit = async (e) => {
    e.preventDefault();
    const activeName = isGuest ? guestName : selectedName;
    if (!activeName || !noteText.trim()) return alert("Select your name and enter a message.");

    try {
      const res = await fetch('http://192.168.0.168:5000/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: activeName, date: selectedDate, text: noteText })
      });
      if (res.ok) {
        alert("Message sent to the kitchen admin dashboard!");
        setNoteText('');
        fetchDayData();
      }
    } catch (err) {
      alert("Could not send message.");
    }
  };

  const handleAddResident = async (e) => {
    e.preventDefault();
    if (!newResidentName.trim()) return;
    
    const updatedList = [...residentList, newResidentName.trim()].sort();
    setResidentList(updatedList);
    setNewResidentName('');
    alert(`${newResidentName.trim()} added successfully!`);
  };

  const handleDeleteDay = async () => {
    if (!window.confirm(`Are you sure you want to permanently delete all recorded data for ${selectedDate}?`)) return;

    try {
      const res = await fetch(`http://192.168.0.168:5000/api/data/${selectedDate}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        alert("Day records wiped cleanly.");
        fetchDayData();
      }
    } catch (err) {
      alert("Could not remove day data.");
    }
  };

  return (
    /* Apply .light-theme class dynamically depending on state status */
    <div className={`container ${!isDarkMode ? 'light-theme' : ''}`}>
      
      {/* Theme Toggling Row Controller */}
      <div className="theme-toggle-row">
        <button type="button" className="theme-toggle-btn" onClick={() => setIsDarkMode(!isDarkMode)}>
          Theme: {isDarkMode ? 'Dark' : 'Light'}
        </button>
      </div>

      <div className="navigation-tabs">
        <button className={view === 'resident' ? 'tab active' : 'tab'} onClick={() => setView('resident')}>Resident Portal</button>
        <button className={view === 'admin' ? 'tab active' : 'tab'} onClick={() => setView('admin')}>Admin Dashboard</button>
      </div>

      <div className="date-picker-bar">
        <label>Target Tracking Date</label>
        <input 
          type="date" 
          value={selectedDate} 
          onClick={(e) => e.target.showPicker && e.target.showPicker()} 
          onChange={(e) => setSelectedDate(e.target.value)} 
        />
      </div>

      {view === 'resident' && (
        <>
          <h2>Meal Attendance Form</h2>
          
          <div className="toggle-container">
            <button type="button" className={`toggle-btn ${!isGuest ? 'active' : ''}`} onClick={() => setIsGuest(false)}>Resident</button>
            <button type="button" className={`toggle-btn ${isGuest ? 'active' : ''}`} onClick={() => setIsGuest(true)}>Add Guest</button>
          </div>

          <form onSubmit={handleMealSubmit} className="meal-form">
            {!isGuest ? (
              <div className="input-group">
                <label>Select Your Name:</label>
                <select value={selectedName} onChange={(e) => setSelectedName(e.target.value)}>
                  <option value="">-- Choose Name --</option>
                  {residentList.map(name => <option key={name} value={name}>{name}</option>)}
                </select>
              </div>
            ) : (
              <div className="input-group">
                <label>Guest Full Name:</label>
                <input type="text" placeholder="e.g. Visitor John" value={guestName} onChange={(e) => setGuestName(e.target.value)} />
              </div>
            )}

            <div className="meals-selection">
              {['breakfast', 'lunch', 'dinner'].map(m => (
                <label key={m} className="checkbox-container">
                  <span style={{ textTransform: 'capitalize' }}>{m}</span>
                  <input type="checkbox" checked={meals[m]} onChange={() => setMeals({...meals, [m]: !meals[m]})} />
                </label>
              ))}
            </div>
            <button type="submit" className="submit-btn">Save Selection</button>
          </form>

          <form onSubmit={handleNoteSubmit} className="note-form">
            <h3>Message for Admin</h3>
            <textarea placeholder="Type special meal requests here..." value={noteText} onChange={(e) => setNoteText(e.target.value)} />
            <button type="submit" className="secondary-btn">Send Message</button>
          </form>
        </>
      )}

      {view === 'admin' && (
        <div className="admin-panel">
          <h2>Kitchen Overview</h2>
          
          <div className="metrics-grid">
            <div className="metric-card"><h3>B</h3><p className="count-number">{dayData.summary.breakfast}</p></div>
            <div className="metric-card"><h3>L</h3><p className="count-number">{dayData.summary.lunch}</p></div>
            <div className="metric-card"><h3>D</h3><p className="count-number">{dayData.summary.dinner}</p></div>
          </div>

          <div className="lists-layout">
            <div className="list-section">
              <h3>Submissions ({dayData.submissions.length})</h3>
              <div className="scroll-box">
                {dayData.submissions.length === 0 ? <p className="empty">No inputs recorded.</p> : 
                  dayData.submissions.map((s, idx) => (
                    <div key={idx} className="list-item">
                      <strong>{s.name} {s.isGuest ? '(G)' : ''}</strong>
                      <span>
                        {[s.meals.breakfast && 'B', s.meals.lunch && 'L', s.meals.dinner && 'D'].filter(Boolean).join(', ') || '-'}
                      </span>
                    </div>
                  ))
                }
              </div>
            </div>

            <div className="list-section">
              <h3>Messages</h3>
              <div className="scroll-box">
                {dayData.notes.length === 0 ? <p className="empty">No messages received.</p> : 
                  dayData.notes.map((n, idx) => (
                    <div key={idx} className="note-item">
                      <strong>{n.name}</strong>: "{n.text}"
                    </div>
                  ))
                }
              </div>
            </div>

            <div className="management-section">
              <h3>Roster Management</h3>
              <form onSubmit={handleAddResident} className="inline-input-row">
                <input 
                  type="text" 
                  placeholder="New resident name..." 
                  value={newResidentName} 
                  onChange={(e) => setNewResidentName(e.target.value)} 
                />
                <button type="submit" className="submit-btn">Add</button>
              </form>
            </div>

            <div className="management-section">
              <h3>Database Cleanup</h3>
              <button type="button" className="danger-btn" onClick={handleDeleteDay}>
                Clear Records for Selected Date
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}