
const fastcsv = require('fast-csv');
const pool = require('../config/db');

const postDonationController = async (req, res) => {
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
}

const donationAndExpensesController = async (req, res) => {
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
}

const dailyDonationController = async (req, res) => {
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
}

const onlyDonationController = async (req, res) => {
    try {
        const result = await pool.query('SELECT SUM(amount) FROM donations');
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching inventory' });
    }
}

const csvDonationController = async (req, res) => {
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
}

const donationListController = async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM donations');
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching inventory' });
    }
}


module.exports = {
    postDonationController,
    donationAndExpensesController,
    dailyDonationController,
    csvDonationController,
    donationListController,
    onlyDonationController
}