import { Request, Response, NextFunction } from 'express';

export interface LogEntry {
  id: string;
  timestamp: string;
  category: 'HTTP' | 'INFO' | 'WARN' | 'ERROR' | 'TESTE';
  method?: string;
  url?: string;
  statusCode?: number;
  duration?: number;
  message: string;
  details?: any;
}

const MAX_LOGS = 1000;
const logs: LogEntry[] = [];

// Helper to generate IDs
let nextId = 1;

export const clearLogs = () => {
  logs.length = 0;
};

export const getLogs = () => {
  return [...logs];
};

export const addLog = (
  category: 'HTTP' | 'INFO' | 'WARN' | 'ERROR' | 'TESTE',
  message: string,
  extra: Partial<Omit<LogEntry, 'id' | 'timestamp' | 'category' | 'message'>> = {}
) => {
  const timestamp = new Date().toISOString();
  const id = `${nextId++}_${Date.now()}`;
  
  const logEntry: LogEntry = {
    id,
    timestamp,
    category,
    message,
    ...extra,
  };

  // Limit size
  if (logs.length >= MAX_LOGS) {
    logs.shift();
  }
  
  logs.push(logEntry);

  // Still log to stdout for real output
  const levelColor: { [key: string]: string } = {
    HTTP: '\x1b[36mHTTP\x1b[0m', // Cyan
    INFO: '\x1b[32mINFO\x1b[0m', // Green
    WARN: '\x1b[33mWARN\x1b[0m', // Yellow
    ERROR: '\x1b[31mERROR\x1b[0m', // Red
    TESTE: '\x1b[35mTESTE\x1b[0m', // Magenta
  }[category];

  console.log(`[${timestamp}] [${levelColor}] ${message} ${extra.statusCode ? `(status: ${extra.statusCode})` : ''}`);
};

export const info = (message: string, details?: any) => {
  addLog('INFO', message, { details });
};

export const warn = (message: string, details?: any) => {
  addLog('WARN', message, { details });
};

export const error = (message: string, details?: any) => {
  addLog('ERROR', message, { details });
};

export const httpLoggerMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  const { method, originalUrl, body, query, headers } = req;

  // We hook into the response finish event to capture the response code and time
  res.on('finish', () => {
    const duration = Date.now() - start;
    const statusCode = res.statusCode;
    
    // Sanitize body to avoid logging passwords or sensitive tokens
    const sanitizedBody = { ...body };
    const sensitiveFields = ['password', 'token', 'accessToken', 'refreshToken', 'pin', 'secret'];
    sensitiveFields.forEach((field) => {
      if (field in sanitizedBody) {
        sanitizedBody[field] = '********';
      }
    });

    const isError = statusCode >= 400;
    const category = isError ? 'ERROR' : 'HTTP';
    const message = `${method} ${originalUrl} ${statusCode} - ${duration}ms`;

    addLog(category, message, {
      method,
      url: originalUrl,
      statusCode,
      duration,
      details: {
        query,
        body: Object.keys(sanitizedBody).length ? sanitizedBody : undefined,
        ip: req.ip || req.socket.remoteAddress,
        userAgent: headers['user-agent'],
      },
    });
  });

  next();
};
