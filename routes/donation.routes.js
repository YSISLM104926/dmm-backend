const express = require('express');
const {
    postDonationController,
    donationAndExpensesController,
    dailyDonationController, onlyDonationController,
    csvDonationController,
    donationListController
} = require('../controllers/donation.controller');
const router = express.Router();

router.post('/donation', postDonationController);
router.get('/donation&expenses/total', donationAndExpensesController);
router.get('/donation/daily', dailyDonationController);
router.get('/only-donations', onlyDonationController);
router.get('/csv-donation', csvDonationController);
router.get('/donations-list', donationListController);


module.exports = router;