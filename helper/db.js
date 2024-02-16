const mysql = require('mysql');

const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'fizaCollection',
};

const db = mysql.createConnection(dbConfig);
db.connect((err) => {
  if (err) {
    console.error('Database connection failed: ' + err);
    return;
  }
  console.log('Connected to the database');
});

function query(sql, values) {
  return new Promise((resolve, reject) => {
    db.query(sql, values, (err, results) => {
      if (err) {
        reject(err);
      } else {
        resolve(results);
      }
    });
  });
}

module.exports = {
  query
};