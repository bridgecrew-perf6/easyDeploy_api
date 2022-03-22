const fs = require('fs');
const aws = require('aws-sdk');
const s3Config = require('../config/config').s3;

// configuro las credenciales del bucket en aws s3
const s3 = new aws.S3({
  region: s3Config.region,
  accessKeyId: s3Config.accessKey,
  secretAccessKey: s3Config.secretKey,
});

const listBuckets = async () => {
  try {
    const data = await s3.listBuckets({}).promise();

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

    const newBucket = await s3.createBucket(options).promise();

    return newBucket;
  } catch (err) {
    throw new Error(err);
  }
};

const listObjects = async (bucketName) => {
  try {
    const data = await s3.listObjectsV2({
      Bucket: bucketName,
    }).promise();

    return data;
  } catch (err) {
    throw new Error(err);
  }
};

const editBucketPolicy = async (bucketName, access) => {
  try {
    const readOnlyAnonUserPolicy = {
      Version: '2012-10-17',
      Statement: [
        {
          Sid: 'AddPerm',
          Effect: access ? 'Allow' : 'Deny',
          Principal: '*',
          Action: [
            's3:GetObject',
          ],
          Resource: [
            `arn:aws:s3:::${bucketName}/*`,
          ],
        },
      ],
    };

    const options = { Bucket: bucketName, Policy: JSON.stringify(readOnlyAnonUserPolicy) };
    const result = await s3.putBucketPolicy(options).promise();

    return result;
  } catch (err) {
    throw new Error(err);
  }
};

const getBucketAclPolicy = async (bucketName) => {
  try {
    const aclPolicy = await s3.getBucketAcl({ Bucket: bucketName }).promise();
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

    const data = await s3.getObject(params).promise();

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

    return s3.upload(params).promise();
  } catch (err) {
    return err;
  }
};

module.exports = {
  listBuckets,
  createBucket,
  listObjects,
  editBucketPolicy,
  getBucketAclPolicy,
  getXml,
  uploadToBucket,
};
