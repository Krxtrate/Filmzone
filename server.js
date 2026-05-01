const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const path = require('path');

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'root',
  database: 'movie_booking'
});

db.connect((err) => {
  if (err) {
    console.error('Error connecting to MySQL:', err.message);
    return;
  }
  console.log('Successfully connected to the movie_booking MySQL database!');
});

// --- API Routes ---

// Get Movies (with optional search)
app.get('/api/movies', (req, res) => {
    let query = `
        SELECT m.movie_id, m.title, m.genre, s.show_id, s.show_date, s.show_time, t.theatre_name 
        FROM movies m 
        JOIN shows s ON m.movie_id = s.movie_id
        JOIN theatres t ON s.theatre_id = t.theatre_id
    `;
    let queryParams = [];

    if (req.query.search) {
        query += ` WHERE m.title LIKE ? OR m.genre LIKE ? OR t.theatre_name LIKE ?`;
        const searchStr = `%${req.query.search}%`;
        queryParams = [searchStr, searchStr, searchStr];
    }
    
    db.query(query, queryParams, (err, results) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        res.json(results);
    });
});

// Register User
app.post('/api/register', (req, res) => {
    const { name, email, phone, password } = req.body;
    
    // Check if email exists
    db.query('SELECT * FROM users WHERE email = ?', [email], (err, results) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        if (results.length > 0) return res.status(400).json({ error: 'Email already exists' });

        db.query('INSERT INTO users (name, email, phone, password) VALUES (?, ?, ?, ?)', 
        [name, email, phone, password], (err, result) => {
            if (err) return res.status(500).json({ error: 'Failed to register' });
            res.json({ success: true, message: 'User registered' });
        });
    });
});

// Login User
app.post('/api/login', (req, res) => {
    const { email, password } = req.body;
    
    db.query('SELECT user_id, name, email FROM users WHERE email = ? AND password = ?', [email, password], (err, results) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        
        if (results.length === 0) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }
        
        res.json({ success: true, user: results[0] });
    });
});

// Book Tickets
app.post('/api/book', (req, res) => {
    const { userId, showId, totalAmount } = req.body;
    
    const bookingDate = new Date().toISOString().split('T')[0];
    
    db.query('INSERT INTO bookings (booking_date, total_amount, user_id, show_id) VALUES (?, ?, ?, ?)',
    [bookingDate, totalAmount, userId, showId], (err, result) => {
        if (err) return res.status(500).json({ error: 'Failed to book ticket' });
        res.json({ success: true, bookingId: result.insertId });
    });
});

// Get User Bookings
app.get('/api/bookings/:userId', (req, res) => {
    const userId = req.params.userId;
    const query = `
        SELECT b.booking_id, b.booking_date, b.total_amount, 
               m.title, s.show_date, s.show_time, t.theatre_name
        FROM bookings b
        JOIN shows s ON b.show_id = s.show_id
        JOIN movies m ON s.movie_id = m.movie_id
        JOIN theatres t ON s.theatre_id = t.theatre_id
        WHERE b.user_id = ?
        ORDER BY b.booking_id DESC
    `;
    
    db.query(query, [userId], (err, results) => {
        if (err) {
            console.error("Bookings query error:", err);
            return res.status(500).json({ error: err.message });
        }
        res.json(results);
    });
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
