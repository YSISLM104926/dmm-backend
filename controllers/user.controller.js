
const bcrypt = require('bcryptjs');
const pool = require('../config/db');

const userRegisterController = async (req, res) => {
    const { username, email, password, phone } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const result = await pool.query(
            'INSERT INTO user_information (username, email, password, phone) VALUES ($1, $2, $3, $4) RETURNING id',
            [username, email, hashedPassword, phone]
        );
        res.status(201).json({ message: 'User registered successfully', result }); // Token in the response
    } catch (error) {
        res.status(500).json({ error: 'Error registering user' });
    }
}

const userLoginController = async (req, res) => {
    const { username, password } = req.body;
    console.log(username, password);
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
}


module.exports = {
    userRegisterController,
    userLoginController
}