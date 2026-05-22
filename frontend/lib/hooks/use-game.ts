'use client';

import { useState, useEffect, useCallback } from 'react';
import { gMachineClient } from '../gmachine-client';
import { useAuth } from '../auth-context';

interface WinningLine {
  line: string;
  count: number;
  symbol: string;
  win: number;
}

interface SpinResult {
  matrix: string[][];
  totalWin: number;
  winningLines: WinningLine[];
  newBalance: number;
}

export function useGame(gameId: string) {
  const { user, token } = useAuth();
  const [balance, setBalance] = useState<number>(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [lastResult, setLastResult] = useState<SpinResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;

    const socket = gMachineClient.connect(token, gameId);

    socket.on('connect', () => {
      console.log('[G-MACHINE] Connected to Game Server');
      setError(null);
    });

    socket.on('connect_error', (err) => {
      console.error('[G-MACHINE] Connection Error:', err);
      setError('Unable to connect to game server. Check your connection or the server URL.');
      setIsSpinning(false);
    });

    socket.on('game_ready', (data: { balance: number, initialMatrix?: string[][] }) => {
      setBalance(data.balance);
      if (data.initialMatrix) {
        setLastResult(prev => ({
          matrix: data.initialMatrix as string[][],
          totalWin: prev?.totalWin || 0,
          winningLines: prev?.winningLines || [],
          newBalance: data.balance || 0
        }));
      }
    });

    socket.on('spin_result', (data: SpinResult) => {
      setLastResult(data);
      setBalance(data.newBalance);
      setIsSpinning(false);
    });

    socket.on('error', (msg: string) => {
      setError(msg);
      setIsSpinning(false);
    });

    return () => {
      gMachineClient.disconnect();
    };
  }, [token, gameId]);

  const spin = useCallback((bet: number) => {
    if (!token || isSpinning) return;
    
    setError(null);
    setIsSpinning(true);
    gMachineClient.spin(token, gameId, bet);
  }, [token, gameId, isSpinning]);

  return {
    balance,
    isSpinning,
    lastResult,
    error,
    spin,
    user
  };
}
