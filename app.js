const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const cors = require('cors');

const indexRouter = require('./routes/index');

const app = express();

app.use(cors());
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);

// catch 404 and forward to error handler
app.use((req, res, next) => {
  const err = new Error('recurso no encontrado');
  err.status = 404;
  next(err);
});

// error handler
app.use((err, req, res, next) => {
  const errorResponse = {
    status: err.status || 500,
    message: err.message || 'internal server error',
  };
  // send the error
  res.status(err.status || 500).json(errorResponse);
});

module.exports = app;
