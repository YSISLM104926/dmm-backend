const express = require('express');
const { Pool } = require('pg');
const jwt = require('jsonwebtoken');
const cors = require('cors');
require('dotenv').config();
const app = express();
const conn = require('./config/db')
const userRoutes = require('./routes/user.routes')
const crisisRoutes = require('./routes/crisis.routes')
const donationRoutes = require('./routes/donation.routes')
const inventoryRoutes = require('./routes/inventory.routes')
const volunteerRoutes = require('./routes/volunteer.routes')

const PORT = process.env.PORT || 5000;

//middleware
app.use(cors());
app.use(express.json());

// DB connection
const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
});


// Auth(Resgister and Login)
app.use(userRoutes);
app.use(crisisRoutes);
app.use(donationRoutes);
app.use(inventoryRoutes);
app.use(volunteerRoutes);



app.get('/', async (req, res) => {
  res.send('Server is running');
})


app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = pool;
