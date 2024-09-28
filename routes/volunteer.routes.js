
const express = require('express');
const {
    postVolunteerController,
    getVolunteerController,
    updateVolunteerController
} = require('../controllers/volunteer.controller');
const router = express.Router();

router.post('/volunteer', postVolunteerController);
router.get('/volunteer', getVolunteerController);
router.put('/volunteer', updateVolunteerController);

module.exports = router;