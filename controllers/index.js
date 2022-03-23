const s3Service = require('../services/aws');

const listBuckets = async (req, res, next) => {
  try {
    const response = [];
    const buckets = await s3Service.listBuckets();

    for await (const bucket of buckets) {
      const accessType = await s3Service.getBucketAccess(bucket.Name);

      response.push({
        name: bucket.Name,
        accessType,
        creationDate: bucket.CreationDate.toLocaleDateString(),
      });
    }

    res.status(200).json(response);
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

const listObjects = async (req, res, next) => {
  try {
    const { bucketName } = req.params;

    const bucketObjects = await s3Service.listObjects(bucketName);
    res.status(200).json(bucketObjects);
  } catch (err) {
    next(err);
  }
};

const createPolicy = async (req, res, next) => {
  try {
    const { name, access } = req.body;

    const result = await s3Service.editBucketPolicy(name, access);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  listBuckets,
  createBucket,
  createPolicy,
  listObjects,
};
