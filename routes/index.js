const router = require('express').Router();
const controller = require('../controllers/index');

router.get('/', controller.home);

module.exports = router;
