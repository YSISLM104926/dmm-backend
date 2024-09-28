// config/db.js
const { Pool } = require('pg');
require('dotenv').config();

// Initialize the connection pool
const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
});

module.exports = pool;
