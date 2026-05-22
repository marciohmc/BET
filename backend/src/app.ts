import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.routes';
import gameRoutes from './routes/game.routes';
import userRoutes from './routes/user.routes';
import promotionRoutes from './routes/promotion.routes';
import transactionRoutes from './routes/transaction.routes';
import logRoutes from './routes/log.routes';
import webhookRoutes from './routes/webhook.routes';
import gmachineRoutes from './routes/gmachine.routes';
import { httpLoggerMiddleware } from './utils/logger';
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';

export function createBackendApp(): Application {
  const app: Application = express();

  app.use(cors());
  app.use('/api/webhooks', webhookRoutes);
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(httpLoggerMiddleware);

  app.use('/api/auth', authRoutes);
  app.use('/api/games', gameRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/promotions', promotionRoutes);
  app.use('/api/transactions', transactionRoutes);
  app.use('/api/logs', logRoutes);
  app.use('/api/gmachine', gmachineRoutes);

  const swaggerOptions = {
    definition: {
      openapi: '3.0.0',
      info: {
        title: 'Cassanova Casino API',
        version: '1.0.0',
        description: 'API documentation and testing for Cassanova Casino',
      },
    },
    apis: ['./backend/src/routes/*.ts'],
  };
  const swaggerSpec = swaggerJsdoc(swaggerOptions);
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

  app.get('/api/health', (req: Request, res: Response) => {
    res.json({ status: 'OK', message: 'Cassanova API is running' });
  });

  return app;
}
