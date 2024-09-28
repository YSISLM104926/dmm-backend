
const pool = require('../config/db');

const crisisPostController = async (req, res) => {
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
}


const crisisGetController = async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM crisis');
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching crises' });
    }
}


const crisisSingleGetController = async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query('SELECT * FROM crisis WHERE id = $1', [id]);
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching crises' });
    }
}

const crisisSingleUpdateController = async (req, res) => {
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
}

const crisisSingleDeleteController = async (req, res) => {
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
}

module.exports = {
    crisisPostController,
    crisisGetController,
    crisisSingleGetController,
    crisisSingleDeleteController,
    crisisSingleUpdateController
}