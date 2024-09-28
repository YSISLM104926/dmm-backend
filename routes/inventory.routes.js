const express = require('express');
const {
    addInventoryController,
    getInventoryController,
    getCsvInventoryController,
    getSingleInventoryController,
    updateSingleInventoryController,
    deleteSingleInventoryController
} = require('../controllers/inventory.controller');
const router = express.Router();

router.post('/inventory', addInventoryController);
router.get('/inventory', getInventoryController);
router.get('/csv-inventory', getCsvInventoryController);
router.get('/inventory/:id', getSingleInventoryController);
router.put('/inventory/:id', updateSingleInventoryController);
router.delete('/inventory/:id', deleteSingleInventoryController);

module.exports = router;