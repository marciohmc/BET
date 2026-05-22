import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';

// Import HTTP logger middleware
import { httpLoggerMiddleware } from './utils/logger';

// Import routes
import authRoutes from './routes/auth.routes';
import gameRoutes from './routes/game.routes';
import userRoutes from './routes/user.routes';
import promotionRoutes from './routes/promotion.routes';
import transactionRoutes from './routes/transaction.routes';
import logRoutes from './routes/log.routes';
import webhookRoutes from './routes/webhook.routes';
import walletRoutes from './routes/wallet.routes';
import diagnosticsRoutes from './routes/diagnostics.routes';

dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 5000;

// Sanitize and validate MONGODB_URI safely
let MONGODB_URI = process.env.MONGODB_URI;

if (MONGODB_URI) {
  // Trim white spaces and strip enclosing single or double quotes
  MONGODB_URI = MONGODB_URI.trim().replace(/^['"]|['"]$/g, '');
}

// Treat "undefined", "null" strings, or empty strings as missing/undefined
if (!MONGODB_URI || MONGODB_URI === 'undefined' || MONGODB_URI === 'null' || MONGODB_URI === '') {
  MONGODB_URI = 'mongodb://localhost:27017/cassanova';
}

// Ensure the connection URL starts with correct scheme
if (!MONGODB_URI.startsWith('mongodb://') && !MONGODB_URI.startsWith('mongodb+srv://')) {
  console.warn(`WARNING: Invalid MongoDB URI prefix: "${MONGODB_URI}".`);
  console.warn(`Expected connection string to start with 'mongodb://' or 'mongodb+srv://'. Using default local fall-back.`);
  MONGODB_URI = 'mongodb://localhost:27017/cassanova';
}

// Middleware
app.use(cors());

// Webhook route needs raw body for signature verification
// We must place it BEFORE express.json()
app.use('/api/webhooks', webhookRoutes);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Apply dynamic HTTP logger middleware
app.use(httpLoggerMiddleware);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/games', gameRoutes);
app.use('/api/users', userRoutes);
app.use('/api/promotions', promotionRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/logs', logRoutes);
app.use('/api/v1/wallet', walletRoutes);
app.use('/api/diagnostics', diagnosticsRoutes);
// Note: Webhooks are mounted earlier for raw body support

// Swagger Documentation
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Cassanova Casino API',
      version: '1.0.0',
      description: 'API documentation and testing for Cassanova Casino',
    },
    servers: [
      {
        url: `http://localhost:${PORT}`,
      },
    ],
  },
  apis: ['./src/routes/*.ts', './src/server.ts'],
};
const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Health check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'OK', message: 'Cassanova API is running' });
});

// Database connection
mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error('MongoDB connection error:', error);
  });

export default app;
