const { check } = require('express-validator');
const validateFields = require('./validateFields');
const s3Service = require('../services/aws');
const utils = require('../utils/customValidations');

const info = [
  check('name', 'formato erroneo')
    .notEmpty()
    .bail()
    .isString()
    .bail()
    .custom((value) => {
      for (let i = 0; i < value.length; i += 1) {
        if (value.charAt(i).toUpperCase() === value.charAt(i)) {
          throw new Error('los nombres no pueden contener mayusculas.');
        }
      }

      if (value.length < 3 || value.length > 63) {
        throw new Error('Los nombres deben tener entre 3 y 63 caracteres.');
      }

      if (utils.isValidIP(value)) {
        throw new Error('Los nombres no deben tener el formato de una dirección IP.');
      }

      if (value.startsWith('xn--', 0)) {
        throw new Error('Los nombres no deben comenzar con el prefijo xn--.');
      }

      if (value.substring(value.search('-s3alias'), value.length) === '-s3alias') {
        throw new Error('Los nombres no deben terminar con el sufijo -s3alias.');
      }

      if (!utils.isAlphaNumeric(value.charAt(0))) {
        throw new Error('Los nombres deben comenzar y terminar con una letra o un número.');
      }

      if (!utils.isAlphaNumeric(value.charAt(value.length - 1))) {
        throw new Error('Los nombres deben comenzar y terminar con una letra o un número.');
      }

      return true;
    })
    .bail(),
  check('access', 'formato erroneo').notEmpty().bail()
    .isInt({ min: 0, max: 2 }),

  validateFields,
];

const exist = async (req, res, next) => {
  try {
    const { bucketName } = req.params;

    const result = await s3Service.bucketExists(bucketName);

    if (result) {
      next();
    }

    res.status(400).json({ status: 400, message: 'bucket no encontrado' });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  info,
  exist,
};
