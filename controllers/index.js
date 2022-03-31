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

    await s3Service.serializeBucketAcl(bucketInformation.name);
    await s3Service.serializeCors(bucketInformation.name);
    await s3Service.setBucketAccess(bucketInformation.name, bucketInformation.access);

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
    const { folder } = req.query;
    const data = [];

    const result = await s3Service.listObjects(bucketName, folder);

    result.Contents.forEach((file) => {
      if (file.Size !== 0) {
        data.push({
          name: file.Key.split('/').pop(),
          type: 'file',
          size: file.Size,
          LastModified: file.LastModified,
        });
      }
    });

    result.CommonPrefixes.forEach((common) => {
      const path = common.Prefix.split('/');

      data.push({
        name: path[path.length - 2],
        type: 'folder',
        size: 0,
        LastModified: '',
      });
    });

    const response = {
      status: 200,
      success: true,
      count: data.length,
      data,
    };

    res.status(200).json(response);
  } catch (err) {
    next(err);
  }
};

const editBucket = async (req, res, next) => {
  try {
    const { name, access } = req.body;

    await s3Service.serializeBucketAcl(name);
    await s3Service.serializeCors(name);
    await s3Service.setBucketAccess(name, access);

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
    await s3Service.deleteBucket(bucketName);

    const response = {
      status: 200,
      success: true,
      message: 'bucket eliminado con exito',
    };

    res.status(200).json(response);
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
