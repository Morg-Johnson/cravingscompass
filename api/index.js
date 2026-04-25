const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
require('dotenv').config();

const v1Router = require('./src/routes/v1');

const app = express();

app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(morgan('dev'));

app.use('/v1', v1Router);

app.use((req, res) => {
  res.status(404).json({ error: { code: 'not_found', message: 'Route not found' } });
});

app.use((err, req, res, next) => {
  const status = err.statusCode || err.status || 500;
  const code = err.code || 'internal_error';
  const message = err.message || 'Internal server error';
  res.status(status).json({ error: { code, message } });
});

const port = Number(process.env.PORT) || 3001;
app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`API listening on port ${port}`);
});
