import { Request, Response } from 'express';
import mongoose from 'mongoose';
import axios from 'axios';

export const getDiagnostics = async (req: Request, res: Response) => {
  const diagnostics: any = {
    timestamp: new Date().toISOString(),
    services: {},
    environment: {
      NODE_ENV: process.env.NODE_ENV,
      CASSANOVA_API_URL: process.env.CASSANOVA_API_URL ? 'Configured' : 'Missing',
      G_MACHINE_SECRET: process.env.G_MACHINE_SECRET ? 'Configured' : 'Missing',
      JWT_SECRET: process.env.JWT_SECRET ? 'Configured' : 'Missing',
      MONGO_URI: process.env.MONGO_URI ? 'Configured' : 'Missing',
    }
  };

  // 1. Database Check
  try {
    const dbStatus = mongoose.connection.readyState;
    const dbStates = ['Disconnected', 'Connected', 'Connecting', 'Disconnecting'];
    diagnostics.services.database = {
      status: dbStatus === 1 ? 'OK' : 'ERROR',
      state: dbStates[dbStatus] || 'Unknown',
      name: 'MongoDB'
    };
  } catch (err: any) {
    diagnostics.services.database = { status: 'ERROR', message: err.message };
  }

  // 2. G-Machine Check (Attempt to see if URL is reachable or just check config)
  const gmachineUrl = process.env.G_MACHINE_URL || 'http://localhost:8080';
  diagnostics.services.gmachine = {
    name: 'G-Machine RGS',
    url: gmachineUrl,
    status: 'UNKNOWN'
  };

  // Skip actual HTTP call if it's a websocket URL, or just check connectivity
  // For now, let's just report the config. 
  // In a real scenario, we'd ping a health endpoint.

  res.json(diagnostics);
};
