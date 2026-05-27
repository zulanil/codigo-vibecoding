import express from 'express';
import swaggerUi from 'swagger-ui-express';
import taskRouter from './tasks/task.router.js';
import userRouter from './users/user.router.js';
import swaggerSpec from './docs/swagger.js';

const app = express();

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});
app.use(express.json());

app.use('/task', taskRouter);
app.use('/user', userRouter);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

export default app;
