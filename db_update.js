const mysql = require('mysql2');
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'root',
  database: 'movie_booking'
});

db.connect((err) => {
  if (err) throw err;
  
  db.query('ALTER TABLE users ADD COLUMN password VARCHAR(255)', (err, result) => {
    if (err) {
      if (err.code === 'ER_DUP_FIELDNAME') {
        console.log('Password column already exists!');
      } else {
        console.error('Error adding column:', err);
      }
    } else {
      console.log('Password column added successfully!');
    }
    db.end();
  });
});
