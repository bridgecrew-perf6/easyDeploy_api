const s3Service = require('../services/aws');

const home = async (req, res, next) => {
  try {
    const buckets = await s3Service.listBuckets();

    buckets.forEach((bucket) => {
      bucket.CreationDate = bucket.CreationDate.toLocaleDateString();
    });

    res.status(200).json(buckets);
  } catch (err) {
    next(err);
  }
};

const createBucket = async (req, res, next) => {
  try {
    const bucketInformation = req.body;
    const createdBucket = await s3Service.createBucket(bucketInformation);

    res.status(201).json(createdBucket);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  home,
  createBucket,
};
