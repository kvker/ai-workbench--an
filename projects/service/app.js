const express = require('express');
const { loadEnv } = require('./src/config/loadEnv');
const codexRouter = require('./src/routes/codex');
const taskRouter = require('./src/routes/task');
const workspaceRouter = require('./src/routes/workspace');

loadEnv();

const app = express();
const port = Number(process.env.PORT ?? 3100);

app.use(express.json());

app.use((req, _res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.originalUrl}`);
  next();
});

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', req.headers['access-control-request-headers'] || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  next();
});

app.options('/{*path}', (_, res) => {
  res.sendStatus(204);
});

app.get('/', (req, res) => {
  res.json({ status: 'ok', service: 'ai-workbench-service' });
});

app.use('/api/workspace', workspaceRouter);
app.use('/api/task', taskRouter);
app.use('/api/codex', codexRouter);

app.use((error, _req, res, _next) => {
  console.error(error);
  res.status(error.statusCode ?? 500).json({ message: error.message ?? 'Internal service error.' });
});

app.listen(port, () => {
  console.log(`AI Workbench service listening on port ${port}`);
});
