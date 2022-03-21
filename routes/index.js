const router = require('express').Router();
const controller = require('../controllers/index');

router.get('/', controller.home);
router.post('/', controller.createBucket);

module.exports = router;
