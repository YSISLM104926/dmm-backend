const express = require('express');
const cors = require('cors');
require('dotenv').config();
const app = express();
const userRoutes = require('./routes/user.routes')
const crisisRoutes = require('./routes/crisis.routes')
const donationRoutes = require('./routes/donation.routes')
const inventoryRoutes = require('./routes/inventory.routes')
const volunteerRoutes = require('./routes/volunteer.routes')
const PORT = process.env.PORT || 5000;

//middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }))

// Routes
app.use('/api', userRoutes);
app.use('/api', crisisRoutes);
app.use('/api', donationRoutes);
app.use('/api', inventoryRoutes);
app.use('/api', volunteerRoutes);


app.get('/', async (req, res) => {
  res.send('Server is running');
})

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});


