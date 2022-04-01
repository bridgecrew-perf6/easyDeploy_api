const router = require('express').Router();
const controller = require('../controllers/index');
const middleware = require('../middlewares/bucketValidator');

router.route('/')
  .get(controller.listBuckets)
  .post(middleware.validateInfo, controller.createBucket);

router.get('/regions', controller.listRegions);

router.route('/:bucketName').all(middleware.validateExist)
  .get(controller.listObjects)
  .post(controller.uploadBucket)
  .put(middleware.validateInfo, controller.editBucket)
  .delete(controller.deleteBucket);

module.exports = router;
