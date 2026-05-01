const mysql = require('mysql2');
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'root',
  database: 'movie_booking'
});
db.connect((err) => {
  db.query('DESCRIBE users', (err, desc) => {
    console.log(desc);
    db.end();
  });
});
