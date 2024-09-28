const express = require('express');
const {
    crisisPostController,
    crisisGetController,
    crisisSingleGetController,
    crisisSingleUpdateController,
    crisisSingleDeleteController
} = require('../controllers/crisis.controller');
const router = express.Router();

router.post('/crisis', crisisPostController);
router.get('/crisis', crisisGetController);
router.get('/crisis/:id', crisisSingleGetController);
router.put('/crisis/:id', crisisSingleUpdateController);
router.delete('/crisis/:id', crisisSingleDeleteController);

module.exports = router;