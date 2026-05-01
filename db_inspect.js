const mysql = require('mysql2');

const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'root',
  database: 'movie_booking'
});

db.connect((err) => {
  if (err) {
    console.error('Error connecting:', err);
    return;
  }
  
  db.query('SHOW TABLES', (err, results) => {
    if (err) throw err;
    console.log('Tables in movie_booking:');
    console.log(results);
    
    // We want to describe all tables
    const tables = results.map(row => Object.values(row)[0]);
    
    let pending = tables.length;
    if (pending === 0) {
        db.end();
        return;
    }

    tables.forEach(table => {
        db.query(`DESCRIBE ${table}`, (err, desc) => {
            if (err) throw err;
            console.log(`\nSchema for ${table}:`);
            console.log(desc.map(c => `${c.Field} (${c.Type})`).join(', '));
            
            pending--;
            if (pending === 0) db.end();
        });
    });
  });
});
