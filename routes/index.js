const router = require('express').Router();
const controller = require('../controllers/index');
const middleware = require('../middlewares/bucketValidator');
const upload = require('../middlewares/upload');

router.route('/')
  .get(controller.listBuckets)
  .post(middleware.validateInfo, controller.createBucket);

router.get('/regions', controller.listRegions);
router.get('/regions/:bucketName', middleware.validateExist, controller.getRegion);

router.route('/:bucketName').all(middleware.validateExist)
  .get(controller.listObjects)
  .post(upload.any(), controller.upload)
  .put(middleware.validateInfo, controller.editBucket)
  .delete(controller.deleteBucket);

router.route('/access/:bucketName').all(middleware.validateExist)
  .get(controller.getAccess);

module.exports = router;
