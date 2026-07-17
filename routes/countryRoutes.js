const router = require('express').Router();
const { getCountries } = require('../controllers/countryController');

router.get('/', getCountries);

module.exports = router;
