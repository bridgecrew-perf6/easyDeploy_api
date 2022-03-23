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

const getObject = async (bucketName) => {
  try {
    const params = {
      Bucket: bucketName,
    };

    const data = await s3.getObject(params).promise();

    return data.Body.toString('utf-8');
  } catch (err) {
    throw new Error(err);
  }
};

const getPublicAccessBlock = async (bucketName) => {
  const status = {
    isEnable: false,
    blockAcl: false,
    blockBucketPolicy: false,
  };

  try {
    const result = await s3.getPublicAccessBlock({ Bucket: bucketName }).promise();

    status.isEnable = true;
    status.blockAcl = result.PublicAccessBlockConfiguration.BlockPublicAcls;
    status.blockBucketPolicy = result.PublicAccessBlockConfiguration.RestrictPublicBuckets;

    return status;
  } catch (err) {
    return status;
  }
};

const getBucketPolicy = async (bucketName) => {
  let isPublicPolicy = false;

  try {
    const bucketPolicy = await s3.getBucketPolicyStatus({ Bucket: bucketName }).promise();
    isPublicPolicy = bucketPolicy.PolicyStatus.IsPublic;

    return isPublicPolicy;
  } catch (err) {
    return isPublicPolicy;
  }
};

const getAclPolicy = async (bucketName) => {
  let isPublicAcl = false;

  try {
    const aclPolicy = await s3.getBucketAcl({ Bucket: bucketName }).promise();

    const publicConditions = ['READ_ACP', 'READ'];

    aclPolicy.Grants.forEach((grant) => {
      if (grant.Grantee.URI && grant.Grantee.URI.includes('AllUsers')) {
        if (publicConditions.some((condition) => grant.Permission.includes(condition))) {
          isPublicAcl = true;
        }
      }
    });

    return isPublicAcl;
  } catch (err) {
    return isPublicAcl;
  }
};

const getBucketAccess = async (bucketName) => {
  try {
    let accessType = 'Privado';
    const blockPublicAccessStatus = await getPublicAccessBlock(bucketName);
    const bucketPolicyStatus = await getBucketPolicy(bucketName);
    const aclPolicyStatus = await getAclPolicy(bucketName);

    if (!blockPublicAccessStatus.isEnable) {
      if (!bucketPolicyStatus && !aclPolicyStatus) {
        accessType = 'Los objetos pueden ser públicos';

        return accessType;
      }

      if (bucketPolicyStatus || aclPolicyStatus) {
        accessType = 'Público';
      }

      return accessType;
    }

    if (!blockPublicAccessStatus.blockAcl && !blockPublicAccessStatus.blockBucketPolicy) {
      accessType = 'Los objetos pueden ser públicos';

      if (bucketPolicyStatus || aclPolicyStatus) {
        accessType = 'Público';
      }
    }

    return accessType;
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
  getObject,
  getBucketPolicy,
  getAclPolicy,
  getPublicAccessBlock,
  getBucketAccess,
  editBucketPolicy,
  uploadToBucket,
};
