const router = require('express').Router();
const controller = require('../controllers/index');

router.get('/', controller.listBuckets);
router.post('/', controller.createBucket);

router.get('/:bucketName', controller.listObjects);
router.post('/policy', controller.createPolicy);

module.exports = router;
