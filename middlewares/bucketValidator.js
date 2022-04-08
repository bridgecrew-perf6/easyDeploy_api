const { check } = require('express-validator');
const validateFields = require('./validateFields');
const s3Service = require('../services/aws');
const utils = require('../utils/customValidations');

const validateName = (name) => {
  const letrasMayusculas = 'ABCDEFGHYJKLMNÑOPQRSTUVWXYZ';

  for (let i = 0; i < name.length; i += 1) {
    if (letrasMayusculas.indexOf(name.charAt(i), 0) !== -1) {
      throw new Error('los nombres no pueden contener mayusculas.');
    }
  }

  if (name.length < 3 || name.length > 63) {
    throw new Error('Los nombres deben tener entre 3 y 63 caracteres.');
  }

  if (utils.isValidIP(name)) {
    throw new Error('Los nombres no deben tener el formato de una dirección IP.');
  }

  if (name.startsWith('xn--', 0)) {
    throw new Error('Los nombres no deben comenzar con el prefijo xn--.');
  }

  if (name.substring(name.search('-s3alias'), name.length) === '-s3alias') {
    throw new Error('Los nombres no deben terminar con el sufijo -s3alias.');
  }

  if (!utils.isAlphaNumeric(name.charAt(0))) {
    throw new Error('Los nombres deben comenzar y terminar con una letra o un número.');
  }

  if (!utils.isAlphaNumeric(name.charAt(name.length - 1))) {
    throw new Error('Los nombres deben comenzar y terminar con una letra o un número.');
  }
};

const validateInfo = [
  check('name', 'el nombre es invalido')
    .notEmpty()
    .bail()
    .isString()
    .bail()
    .custom((value) => {
      validateName(value);

      return true;
    })
    .bail(),
  check('access', 'el tipo de acceso es invalido').notEmpty().bail()
    .isString()
    .bail()
    .isInt({ min: 0, max: 2 }),

  check('region', 'la region es invalida').notEmpty().bail()
    .isString()
    .bail()
    .custom((value) => {
      let err = true;
      const regions = s3Service.listRegions();

      regions.forEach((region) => {
        if (value === region.id) {
          err = false;
        }
      });

      if (err) {
        throw new Error('la region es invalida');
      }

      return true;
    }),

  validateFields,
];

const validateAccess = [
  check('access', 'el tipo de acceso es invalido').notEmpty().bail()
    .isString()
    .bail()
    .isInt({ min: 0, max: 2 }),

  validateFields,
];

const validateExist = async (req, res, next) => {
  try {
    const { bucketName } = req.params;

    validateName(bucketName);

    const result = await s3Service.bucketExists(bucketName);

    if (!result.exist || result.status === 403) {
      const response = {
        status: result.status,
        success: false,
        message: result.message,
      };

      return res.status(result.status).json(response);
    }

    return next();
  } catch (err) {
    return next(err);
  }
};

module.exports = {
  validateName,
  validateInfo,
  validateAccess,
  validateExist,
};
