const express = require('express');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
require('dotenv').config();
const fastcsv = require('fast-csv');
// express_app
const app = express();

//middleware
app.use(cors());
app.use(express.json());

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
});

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (token == null) return res.sendStatus(401);

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// Register 
app.post('/api/auth/register', async (req, res) => {
  const { username, email, password, phone } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await pool.query(
      'INSERT INTO user_information (username, email, password, phone) VALUES ($1, $2, $3, $4) RETURNING id',
      [username, email, hashedPassword, phone]
    );
    res.status(201).json({ message: 'User registered successfully' }); // Token in the response
  } catch (error) {
    res.status(500).json({ error: 'Error registering user' });
  }
});


app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const result = await pool.query('SELECT * FROM user_information WHERE username = $1', [username]);
    const user = result.rows[0];
    console.log(user);
    if (user && await bcrypt.compare(password, user.password)) {
      const token = jwt.sign({ username: username, role: user.role, email: user.email }, process.env.JWT_SECRET);
      res.json({ token });
    } else {
      res.status(401).json({ error: 'Invalid credentials' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Error logging in' });
  }
});

// Crisis Routes
app.post('/api/crisis', async (req, res) => {
  console.log('dddd');
  const { title, location, severity, description, requiredHelp, images } = req.body; // 'images' is an array of URLs
  try {
    const result = await pool.query(
      'INSERT INTO crisis (title, location, severity, description, required_help, image) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [title, location, severity, description, requiredHelp, images] // Directly store the array of image URLs
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ error: 'Error creating crisis' });
  }
});



app.get('/api/crisis', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM crisis');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching crises' });
  }
});

// GET single crisis
app.get('/api/crisis/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('SELECT * FROM crisis WHERE id = $1', [id]);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching crises' });
  }
});

app.put('/api/crisis/:id', async (req, res) => {
  const { value, id } = req.body;
  try {
    const result = await pool.query(
      'UPDATE crisis SET status = $1 WHERE id = $2 RETURNING *',
      [value, id]
    );
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Error updating crisis' });
  }
});

app.delete('/api/crisis/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      'DELETE FROM crisis WHERE id = $1 RETURNING *',
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Crisis not found' });
    }
    res.json({ message: 'Crisis deleted successfully', deletedCrisis: result.rows[0] });
  } catch (error) {
    console.error('Error deleting crisis:', error);
    res.status(500).json({ error: 'Error deleting crisis' });
  }
});

// Donation Routes
app.post('/api/donation', async (req, res) => {
  const { name, email, amount } = req.body;
  console.log(name, email, amount);
  try {
    const result = await pool.query(
      'INSERT INTO donations (name, email, amount, relief_type) VALUES ($1, $2, $3, $4) RETURNING *',
      [name, email, amount, 'Relief']
    )
    console.log(result);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Error creating donation' });
  }
});




// only Fetch Donation
app.get('/api/donation/total', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT SUM(total_donations) AS total_donations 
      FROM (
        SELECT SUM(de.donations) AS total_donations 
        FROM donations_expenses de 
        UNION ALL
        SELECT SUM(d.amount) AS total_donations 
        FROM donations d
      ) AS combined_totals
    `);
    res.json({ total: result.rows[0].total_donations });
  } catch (error) {
    console.error('Error fetching total donations:', error);
    res.status(500).json({ error: 'Error fetching total donations' });
  }
});

// Fetch Donation and Expenses
app.get('/api/donation&expenses/total', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        DATE_TRUNC('day', COALESCE(donations.updated_at, inventory.updated_at)) AS date,
        CAST(COALESCE(SUM(CAST(donations.amount AS numeric)), 0) AS INTEGER) AS total_donations,
        CAST(SUM(CAST(COALESCE(inventory.price, '0') AS numeric)) / 2 AS INTEGER) AS total_expenses
      FROM
        donations
      FULL OUTER JOIN
        inventory
      ON
        DATE_TRUNC('day', donations.updated_at) = DATE_TRUNC('day', inventory.updated_at)
      GROUP BY
        DATE_TRUNC('day', COALESCE(donations.updated_at, inventory.updated_at))
      ORDER BY
        date;
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching total donations and expenses:', error);
    res.status(500).json({ error: 'Error fetching total donations and expenses' });
  }
});

app.get('/api/donation/daily', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT DATE(created_at) as date, SUM(amount) as total
      FROM donations
      GROUP BY DATE(created_at)
      ORDER BY DATE(created_at) DESC
      LIMIT 7
    `);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching daily donations' });
  }
});

// Inventory Routes
app.post('/api/inventory', async (req, res) => {
  const { name, quantity, price } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO inventory (name, quantity, price, expense_type) VALUES ($1, $2, $3, $4) RETURNING *',
      [name, quantity, price, 'Expense']
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Error creating inventory item' });
  }
});

app.get('/api/inventory', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM inventory');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching inventory' });
  }
});

app.get('/api/only-donations', async (req, res) => {
  try {
    const result = await pool.query('SELECT SUM(amount) FROM donations');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching inventory' });
  }
});


app.get('/api/csv-donation', async (req, res) => {
  try {
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));
    const result = await pool.query(
      'SELECT * FROM donations WHERE updated_at >= $1 AND updated_at <= $2',
      [startOfDay, endOfDay]
    );
    const formattedDate = new Date().toISOString().slice(0, 10);
    const filename = `donations_${formattedDate}.csv`;
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
    const csvStream = fastcsv.format({ headers: true });
    csvStream.pipe(res);
    result.rows.forEach(row => {
      csvStream.write(row);
    });
    csvStream.end();
  } catch (error) {
    res.status(500).json({ error: 'Error fetching donations' });
  }
});


app.get('/api/csv-inventory', async (req, res) => {
  try {
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));
    const result = await pool.query(
      'SELECT * FROM inventory WHERE updated_at >= $1 AND updated_at <= $2',
      [startOfDay, endOfDay]
    );
    const formattedDate = new Date().toISOString().slice(0, 10);
    const filename = `inventory_expenses_${formattedDate}.csv`;
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
    const csvStream = fastcsv.format({ headers: true });
    csvStream.pipe(res);
    result.rows.forEach(row => {
      csvStream.write(row);
    });
    csvStream.end();
  } catch (error) {
    res.status(500).json({ error: 'Error fetching donations' });
  }
});





app.get('/api/donations-list', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM donations');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching inventory' });
  }
});

app.get('/api/inventory/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('SELECT * FROM inventory WHERE id = $1', [id]);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching inventory' });
  }
});

app.put('/api/inventory/:id', async (req, res) => {
  const { id } = req.params;
  const { name, quantity, price } = req.body;


  try {
    const result = await pool.query(
      'UPDATE inventory SET name = $1, quantity = $2, price = $3, updated_at = CURRENT_TIMESTAMP WHERE id = $4 RETURNING *',
      [name, quantity, price, id]
    );
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating inventory item:', error.message);
    res.status(500).json({ error: 'Error updating inventory item: ' + error.message });
  }
});

app.delete('/api/inventory/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM inventory WHERE id = $1', [id]);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Error deleting inventory item' });
  }
});

// Volunteer Routes
app.post('/api/volunteer', async (req, res) => {
  const { name, age, phone, email, skills } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO volunteers (name, age, phone, email, skills, status) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [name, age, phone, email, skills, 'Pending']
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Error registering volunteer' });
  }
});

app.get('/api/volunteer', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM user_information WHERE role = $1', ['Volunteer']);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching volunteers' });
  }
});

app.put('/api/volunteer', async (req, res) => {
  const { id, data } = req.body;
  try {
    if (data.task && data.taskLocation) {
      const result = await pool.query(
        'UPDATE user_information SET assigntask = $1, location = $2 WHERE id = $3 RETURNING *',
        [data.task, data.taskLocation, id]
      );
      res.json(result.rows[0]);
    } else if (data.taskLocation) {
      const result = await pool.query(
        'UPDATE user_information SET location = $1 WHERE id = $2 RETURNING *',
        [data.taskLocation, id]
      );
      res.json(result.rows[0]);
    } else if (data.task) {
      const result = await pool.query(
        'UPDATE user_information SET assigntask = $1 WHERE id = $2 RETURNING *',
        [data.task, id]
      );
      res.json(result.rows[0]);
    }
  } catch (error) {
    res.status(500).json({ error: 'Error updating volunteer' });
  }
});

app.get('/', async (req, res) => {
  res.send('Server is running');
})

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});