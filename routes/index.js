const router = require('express').Router();
const controller = require('../controllers/index');
const validator = require('../middlewares/checkBucket');

router.get('/', controller.listBuckets);
router.post('/', validator.validateCreation, controller.createBucket);

router.get('/:bucketName', controller.listObjects);
router.post('/:bucketName', controller.uploadBucket);
router.put('/:bucketName', controller.editBucket);

module.exports = router;
