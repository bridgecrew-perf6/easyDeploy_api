const fs = require('fs');
const S3 = require('aws-sdk');
const s3Config = require('../config/config').s3;

// configuro las credenciales del bucket en aws s3
const storage = new S3.S3({
  region: s3Config.region,
  accessKeyId: s3Config.accessKey,
  secretAccessKey: s3Config.secretKey,
});

const listBuckets = async () => {
  try {
    const data = await storage.listBuckets({}).promise();

    return data.Buckets;
  } catch (err) {
    throw new Error(err);
  }
};

const createBucket = async (bucketToCreate) => {
  try {
    const options = {
      Bucket: bucketToCreate.name,
      ACL: bucketToCreate.access,
    };

    const newBucket = await storage.createBucket(options).promise();

    return newBucket;
  } catch (err) {
    throw new Error(err);
  }
};

const listObjects = async (bucketName) => {
  try {
    const data = await storage.listObjectsV2({ Bucket: bucketName }).promise();

    return data;
  } catch (err) {
    throw new Error(err);
  }
};

const getBucketAclPolicy = async (bucketName) => {
  try {
    const aclPolicy = await storage.getBucketAcl({ Bucket: bucketName }).promise();
    let allUsersPolicy = 'privado';
    const publicConditions = ['READ_ACP', 'READ'];

    aclPolicy.Grants.forEach((grant) => {
      if (grant.Grantee.URI && grant.Grantee.URI.includes('AllUsers')) {
        if (publicConditions.some((e) => grant.Permission.includes(e))) {
          allUsersPolicy = 'público';
        }
      }
    });

    return allUsersPolicy;
  } catch (err) {
    throw new Error(err);
  }
};

const getXml = async () => {
  try {
    const params = {
      Bucket: process.env.BUCKET,
      Key: 'modelos.xml',
    };

    const data = await storage.getObject(params).promise();

    return data.Body.toString('utf-8');
  } catch (err) {
    throw new Error(err);
  }
};

// recibe la ruta donde esta el archivo temporal del xml y lo sube al bucket
const uploadToBucket = async (filePath) => {
  try {
    const stream = fs.createReadStream(filePath);

    const params = {
      Bucket: process.env.BUCKET,
      Key: 'modelos.xml',
      Body: stream,
      ACL: 'public-read',
      ContentType: 'txt/xml',
      ContentDisposition: 'inline',
    };

    return storage.upload(params).promise();
  } catch (err) {
    return err;
  }
};

module.exports = {
  listBuckets,
  createBucket,
  listObjects,
  getBucketAclPolicy,
  getXml,
  uploadToBucket,
};
