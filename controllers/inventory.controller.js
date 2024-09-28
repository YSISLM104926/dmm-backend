
const fastcsv = require('fast-csv');
const pool = require('../config/db');

const addInventoryController = async (req, res) => {
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
}


const getInventoryController = async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM inventory');
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching inventory' });
    }
}

const getCsvInventoryController = async (req, res) => {
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
}

const getSingleInventoryController = async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query('SELECT * FROM inventory WHERE id = $1', [id]);
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching inventory' });
    }
}

const updateSingleInventoryController = async (req, res) => {
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
}

const deleteSingleInventoryController = async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query('DELETE FROM inventory WHERE id = $1', [id]);
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ error: 'Error deleting inventory item' });
    }
}

module.exports = {
    addInventoryController,
    getInventoryController,
    getCsvInventoryController,
    getSingleInventoryController,
    updateSingleInventoryController,
    deleteSingleInventoryController
}