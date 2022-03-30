const router = require('express').Router();
const controller = require('../controllers/index');
const bucketValidator = require('../middlewares/bucketValidator');

router.route('/')
  .get(controller.listBuckets)
  .post(bucketValidator.info, controller.createBucket);

router.get('/regions', controller.listRegions);

router.route('/:bucketName', bucketValidator.exist)
  .get(controller.listObjects)
  .post(controller.uploadBucket)
  .put(bucketValidator.info, controller.editBucket)
  .delete(controller.deleteBucket);

module.exports = router;
