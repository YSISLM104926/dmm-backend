
const express = require('express');
const router = express.Router();
const pool = require('../server')

// Volunteer Routes
router.post('/api/volunteer', async (req, res) => {
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

router.get('/api/volunteer', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM user_information WHERE role = $1', ['Volunteer']);
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching volunteers' });
    }
});

router.put('/api/volunteer', async (req, res) => {
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


module.exports = router;