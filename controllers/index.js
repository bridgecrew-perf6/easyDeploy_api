const fs = require('fs');
const s3Service = require('../services/aws');
const parser = require('../utils/parser');

const listRegions = (req, res) => {
  const regions = s3Service.listRegions();

  const response = {
    status: 200,
    success: true,
    count: regions.length,
    regions,
  };

  res.status(200).json(response);
};

const listBuckets = async (req, res, next) => {
  try {
    let statusCode = 200;
    const result = [];
    const data = await s3Service.listBuckets();

    data.Buckets.forEach((bucket) => {
      result.push({
        name: bucket.Name,
        creationDate: bucket.CreationDate.toLocaleDateString(),
      });
    });

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

const getAccess = async (req, res, next) => {
  try {
    const { bucketName } = req.params;

    const access = await s3Service.getBucketAccess(bucketName);

    const response = {
      status: 200,
      success: true,
      data: {
        bucket: bucketName,
        access,
      },
    };

    res.status(200).json(response);
  } catch (err) {
    next(err);
  }
};

const getRegion = async (req, res, next) => {
  try {
    const { bucketName } = req.params;
    const bucketRegion = {};

    const allRegions = s3Service.listRegions();
    const result = await s3Service.getBucketRegion(bucketName);

    allRegions.forEach((region) => {
      if (region.id === result.LocationConstraint || result.LocationConstraint === null) {
        bucketRegion.name = region.name;
        bucketRegion.id = region.id;
      }
    });

    const response = {
      status: 200,
      success: true,
      data: {
        bucket: bucketName,
        region: bucketRegion,
      },
    };

    res.status(200).json(response);
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

    const result = await s3Service.listObjects(bucketName, folder, true);

    const path = result.Prefix.split('/');
    const prev = path.length < 3 ? '' : result.Prefix.replace(`${path[path.length - 2]}/`, '');

    result.Contents.forEach((file) => {
      if (file.Size !== 0) {
        data.push({
          name: file.Key.split('/').pop(),
          type: 'file',
          size: parser.formatBytes(file.Size),
          LastModified: file.LastModified.toLocaleDateString(),
          path: file.Key,
          link: `https://${bucketName}.s3.amazonaws.com/${file.Key}`,
        });
      }
    });

    result.CommonPrefixes.forEach((common) => {
      const folderPath = common.Prefix.split('/');

      data.push({
        name: folderPath[folderPath.length - 2],
        type: 'folder',
        size: 0,
        LastModified: '',
        path: common.Prefix,
      });
    });

    const response = {
      status: 200,
      success: true,
      count: data.length,
      prev,
      data,
    };

    res.status(200).json(response);
  } catch (err) {
    next(err);
  }
};

const editBucket = async (req, res, next) => {
  try {
    const { access } = req.body;
    const { bucketName } = req.params;

    await s3Service.serializeBucketAcl(bucketName);
    await s3Service.serializeCors(bucketName);
    await s3Service.setBucketAccess(bucketName, access);

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

const getSignedUrl = async (req, res, next) => {
  try {
    const { bucketName } = req.params;
    const fileToUpload = req.body;

    const data = await s3Service.signedUrl(bucketName, fileToUpload);

    const response = {
      status: 200,
      success: true,
      data,
    };

    res.status(200).json(response);
  } catch (err) {
    next(err);
  }
};

const upload = async (req, res, next) => {
  try {
    const { bucketName } = req.params;
    const { files } = req;
    const result = await s3Service.uploadToBucket(bucketName, files[0]);
    fs.unlink(`${files[0].path}`, (err) => {
      if (err) throw err;
    });

    const response = {
      status: 201,
      success: true,
      data: result,
    };

    res.status(201).json(response);
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
  getRegion,
  getAccess,
  createBucket,
  editBucket,
  listObjects,
  getSignedUrl,
  upload,
  deleteBucket,
};
