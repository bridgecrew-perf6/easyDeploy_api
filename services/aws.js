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

// PUBLIC ACCESS BLOCK METHODS

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

const editPublicAccessBlock = async (bucketName, enable) => {
  const publicAccessConfig = {
    Bucket: bucketName,
    PublicAccessBlockConfiguration: {
      BlockPublicAcls: enable,
      BlockPublicPolicy: enable,
      IgnorePublicAcls: enable,
      RestrictPublicBuckets: enable,
    },
  };

  try {
    const result = await s3.putPublicAccessBlock(publicAccessConfig).promise();

    return result;
  } catch (err) {
    throw new Error(err);
  }
};
/* -------------------------------------------------------------------------------- */

// BUCKET POLICY METHODS

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

const deleteBucketPolicy = async (bucketName) => {
  try {
    const result = await s3.deleteBucketPolicy({ Bucket: bucketName }).promise();

    return result;
  } catch (err) {
    throw new Error(err);
  }
};

/* -------------------------------------------------------------------------------- */

// BUCKET ACL METHODS
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

const serializeBucketAcl = async (bucketName) => {
  try {
    const options = {
      Bucket: bucketName,
      GrantFullControl: 'id=f4810a3c8e4459998eff93c114b11eade9969f77741b7b678c26b4e0fbab14e5',
      GrantWrite: 'uri=http://acs.amazonaws.com/groups/s3/LogDelivery',
      GrantRead: 'uri=http://acs.amazonaws.com/groups/s3/LogDelivery',
    };

    const result = await s3.putBucketAcl(options).promise();

    return result;
  } catch (err) {
    throw new Error(err);
  }
};

/* -------------------------------------------------------------------------------- */

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

const editBucket = async (bucketName, access) => {
  await serializeBucketAcl(bucketName);

  try {
    const bucketInfo = {
      name: bucketName,
      access,
    };

    switch (access) {
      case 0:
        await editPublicAccessBlock(bucketName, false);
        await editBucketPolicy(bucketName, true);

        break;
      case 1:
        await editPublicAccessBlock(bucketName, true);
        await editBucketPolicy(bucketName, false);

        break;
      case 2:
        await deleteBucketPolicy(bucketName);
        await editPublicAccessBlock(bucketName, false);

        break;

      default:
        break;
    }

    return bucketInfo;
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
  // BUCKETS METHODS
  listBuckets,
  listObjects,
  createBucket,
  getObject,
  getBucketAccess,
  editBucket,
  uploadToBucket,
  // POLICY METHODS
  getBucketPolicy,
  editBucketPolicy,
  deleteBucketPolicy,
  // ACL METHODS
  getAclPolicy,
  serializeBucketAcl,
  // PUBLIC ACCESS MEHODS
  getPublicAccessBlock,
  editPublicAccessBlock,
};
