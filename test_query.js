const mysql = require('mysql2');
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'root',
  database: 'movie_booking'
});
db.connect((err) => {
  const query = `
      SELECT b.booking_id, b.booking_date, b.total_amount, 
             m.title, s.show_date, s.show_time, t.theatre_name
      FROM bookings b
      JOIN shows s ON b.show_id = s.show_id
      JOIN movies m ON s.movie_id = m.movie_id
      JOIN theatres t ON s.theatre_id = t.theatre_id
      WHERE b.user_id = 1
      ORDER BY b.booking_id DESC
  `;
  db.query(query, (err, results) => {
      if (err) console.error("SQL Error:", err);
      else console.log("Results:", results);
      db.end();
  });
});
