const express = require('express');
const router = express.Router();
const { userRegisterController, userLoginController } = require('../controllers/user.controller');


router.post('/auth/register', userRegisterController);
router.post('/auth/login', userLoginController);


module.exports = router;
