const mysql = require('mysql2');

const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'root',
  database: 'movie_booking'
});

db.connect((err) => {
  if (err) throw err;
  
  db.query(`
    SELECT m.title, m.genre, s.show_date, s.show_time, t.theatre_name 
    FROM movies m 
    LEFT JOIN shows s ON m.movie_id = s.movie_id
    LEFT JOIN theatres t ON s.theatre_id = t.theatre_id
  `, (err, results) => {
    if (err) throw err;
    console.log(results);
    db.end();
  });
});
