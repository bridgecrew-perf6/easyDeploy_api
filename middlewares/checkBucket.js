const { check } = require('express-validator');
const validateFields = require('./validateFields');
const utils = require('../utils/customValidations');

const validateCreation = [
  check('name', 'required').notEmpty().bail(),
  check('name', 'bad format').isString().bail()
    .isLength({ min: 3, max: 63 })
    .bail()
    .custom((value) => {
      if (utils.isValidIP(value)) {
        throw new Error('Los nombres no deben tener el formato de una dirección IP');
      }

      if (value.startsWith('xn--', 0)) {
        throw new Error('Los nombres no deben comenzar con el prefijo xn--');
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
  check('access', 'bad format').isInt({ min: 0, max: 2 }),

  validateFields,
];

module.exports = {
  validateCreation,
};
