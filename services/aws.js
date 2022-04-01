const fs = require('fs');
const aws = require('aws-sdk');
const s3Config = require('../config/config').s3;

const s3 = new aws.S3({
  region: s3Config.region,
  accessKeyId: s3Config.accessKey,
  secretAccessKey: s3Config.secretKey,
});

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

// OBJECTS METHODS

const listObjects = async (bucketName, folder = '') => {
  try {
    const data = await s3.listObjectsV2({
      Bucket: bucketName,
      Delimiter: '/',
      Prefix: folder === '' ? '' : `${folder}/`,
      MaxKeys: 2000,
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

const deleteObjects = async (Bucket) => {
  try {
    const objectsToDelete = [];
    const allObjets = await listObjects(Bucket);

    allObjets.Contents.forEach((object) => {
      objectsToDelete.push({
        Key: object.Key,
      });
    });

    const options = {
      Bucket,
      Delete: {
        Objects: objectsToDelete,
        Quiet: false,
      },
    };

    const result = await s3.deleteObjects(options).promise();

    return result;
  } catch (err) {
    throw new Error(err);
  }
};

/* -------------------------------------------------------------------------------- */

// CORS METHODS

const serializeCors = async (Bucket) => {
  try {
    const options = {
      Bucket,
      CORSConfiguration: {
        CORSRules: [
          {
            AllowedHeaders: [
              '*',
            ],
            AllowedMethods: [
              'GET',
            ],
            AllowedOrigins: [
              '*',
            ],
            ExposeHeaders: [
              'x-amz-server-side-encryption',
              'x-amz-request-id',
              'x-amz-id-2',
            ],
            MaxAgeSeconds: 3000,
          },
        ],
      },
      ContentMD5: '',
    };

    const result = await s3.putBucketCors(options).promise();

    return result;
  } catch (err) {
    throw new Error(err);
  }
};

/* -------------------------------------------------------------------------------- */

// BUCKET METHODS

const listRegions = () => {
  const data = [
    {
      name: 'US East (Ohio)',
      id: 'us-east-2',
    },
    {
      name: 'US East (N. Virginia)',
      id: 'us-east-1',
    },
    {
      name: 'US West (N. California)',
      id: 'us-west-1',
    },
    {
      name: 'US West (Oregon)',
      id: 'us-west-2',
    },
    {
      name: 'Africa (Cape Town)',
      id: 'af-south-1',
    },
    {
      name: 'Asia Pacific (Hong Kong)',
      id: 'ap-east-1',
    },
    {
      name: 'Asia Pacific (Jakarta)',
      id: 'ap-southeast-3',
    },
    {
      name: 'Asia Pacific (Mumbai)',
      id: 'ap-south-1',
    },
    {
      name: 'Asia Pacific (Osaka)',
      id: 'ap-northeast-3',
    },
    {
      name: 'Asia Pacific (Seoul)',
      id: 'ap-northeast-2',
    },
    {
      name: 'Asia Pacific (Singapore)',
      id: 'ap-southeast-1',
    },
    {
      name: 'Asia Pacific (Sydney)',
      id: 'ap-southeast-2',
    },
    {
      name: 'Asia Pacific (Tokyo)',
      id: 'ap-northeast-1',
    },
    {
      name: 'Canada (Central)',
      id: 'ca-central-1',
    },
    {
      name: 'China (Beijing)',
      id: 'cn-north-1',
    },
    {
      name: 'China (Ningxia)',
      id: 'cn-northwest-1',
    },
    {
      name: 'Europe (Frankfurt)',
      id: 'eu-central-1',
    },
    {
      name: 'Europe (Ireland)',
      id: 'eu-west-1',
    },
    {
      name: 'Europe (London)',
      id: 'eu-west-2',
    },
    {
      name: 'Europe (Milan)',
      id: 'eu-south-1',
    },
    {
      name: 'Europe (Paris)',
      id: 'eu-west-3',
    },
    {
      name: 'Europe (Stockholm)',
      id: 'eu-north-1',
    },
    {
      name: 'South America (São Paulo)',
      id: 'sa-east-1',
    },
    {
      name: 'Middle East (Bahrain)',
      id: 'me-south-1',
    },
    {
      name: 'AWS GovCloud (US-East)',
      id: 'us-gov-east-1',
    },
    {
      name: 'AWS GovCloud (US-West)',
      id: 'us-gov-west-1',
    },
  ];

  return data;
};

const listBuckets = async () => {
  try {
    const data = await s3.listBuckets({}).promise();

    return data;
  } catch (err) {
    throw new Error(err);
  }
};

const bucketExists = async (Bucket) => {
  const result = {
    exist: true,
    status: 200,
    message: 'el bucket existe',
  };

  try {
    await s3.headBucket({ Bucket }).promise();

    return result;
  } catch (err) {
    if (err.statusCode === 404 || err.statusCode === 400) {
      result.status = err.statusCode;
      result.exist = false;
      result.message = 'el bucket no existe';
      return result;
    }

    if (err.statusCode === 403) {
      result.status = err.statusCode;
      result.message = 'acceso denegado';
      return result;
    }

    throw new Error(err);
  }
};

const createBucket = async (bucketToCreate) => {
  try {
    const exists = await bucketExists(bucketToCreate.name);

    if (exists) {
      const error = new Error('el bucket ya existe');
      error.status = 400;
      throw error;
    }

    const options = {
      Bucket: bucketToCreate.name,
      CreateBucketConfiguration: {
        LocationConstraint: bucketToCreate.region ? bucketToCreate.region : 'sa-east-1',
      },
    };

    const newBucket = await s3.createBucket(options).promise();

    return newBucket;
  } catch (err) {
    if (err.statusCode === 409) {
      const error = new Error('el bucket ya existe');
      error.status = 400;
      throw error;
    }

    throw err;
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

const setBucketAccess = async (bucketName, access) => {
  try {
    switch (access) {
      case '0':
        await editPublicAccessBlock(bucketName, false);
        await editBucketPolicy(bucketName, true);

        break;
      case '1':
        await editPublicAccessBlock(bucketName, true);
        await editBucketPolicy(bucketName, false);

        break;
      case '2':
        await deleteBucketPolicy(bucketName);
        await editPublicAccessBlock(bucketName, false);

        break;
      default:
        await editPublicAccessBlock(bucketName, false);
        await editBucketPolicy(bucketName, true);

        break;
    }
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

const deleteBucket = async (Bucket) => {
  try {
    await deleteObjects(Bucket);
    const result = await s3.deleteBucket({ Bucket }).promise();

    return result;
  } catch (err) {
    throw new Error(err);
  }
};

/* -------------------------------------------------------------------------------- */

module.exports = {
  // BUCKETS METHODS
  listRegions,
  listBuckets,
  getBucketAccess,
  createBucket,
  setBucketAccess,
  uploadToBucket,
  deleteBucket,
  bucketExists,
  // OBJECTS METHODS
  listObjects,
  getObject,
  deleteObjects,
  // POLICY METHODS
  getBucketPolicy,
  editBucketPolicy,
  deleteBucketPolicy,
  // ACL METHODS
  getAclPolicy,
  serializeBucketAcl,
  // PUBLIC ACCESS METHODS
  getPublicAccessBlock,
  editPublicAccessBlock,
  // CORS METHODS
  serializeCors,
};
