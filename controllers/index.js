const s3Service = require('../services/aws');

const listRegions = (req, res) => {
  const regions = s3Service.listRegions();

  const response = {
    status: 200,
    success: true,
    regions,
  };

  res.status(200).json(response);
};

const listBuckets = async (req, res, next) => {
  try {
    let statusCode = 200;
    const result = [];
    const data = await s3Service.listBuckets();

    for await (const bucket of data.Buckets) {
      const accessType = await s3Service.getBucketAccess(bucket.Name);

      result.push({
        name: bucket.Name,
        accessType,
        creationDate: bucket.CreationDate.toLocaleDateString(),
      });
    }

    if (result.length <= 0) {
      statusCode = 204;
    }

    const response = {
      status: statusCode,
      success: true,
      acount: data.Owner.DisplayName,
      count: data.Buckets.length,
      buckets: result,
    };

    res.status(statusCode).json(response);
  } catch (err) {
    next(err);
  }
};

const createBucket = async (req, res, next) => {
  try {
    const bucketInformation = req.body;
    const result = await s3Service.createBucket(bucketInformation);

    const response = {
      status: 201,
      success: true,
      url: result.Location,
      message: 'bucket creado con exito',
    };

    res.status(201).json(response);
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

const editBucket = async (req, res, next) => {
  try {
    const { name, access } = req.body;

    await s3Service.editBucket(name, access);

    const response = {
      status: 200,
      success: true,
      message: 'bucket editado con exito',
    };

    res.status(200).json(response);
  } catch (err) {
    next(err);
  }
};

const uploadBucket = async (req, res, next) => {
  try {
    res.status(200).json({ message: 'exmple' });
  } catch (err) {
    next(err);
  }
};

const deleteBucket = async (req, res, next) => {
  try {
    const { bucketName } = req.params;
    const result = await s3Service.deleteBucket(bucketName);

    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  listRegions,
  listBuckets,
  createBucket,
  editBucket,
  listObjects,
  uploadBucket,
  deleteBucket,
};
