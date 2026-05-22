'use client';

import { useState, useEffect, useCallback } from 'react';
import { gMachineClient } from '../gmachine-client';
import { useAuth } from '../auth-context'; // Assumindo que useAuth fornece o token

export function useGame(gameId: string) {
  const { user, token } = useAuth();
  const [balance, setBalance] = useState<number>(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [lastResult, setLastResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;

    const socket = gMachineClient.connect(token, gameId);

    socket.on('game_ready', (data: any) => {
      setBalance(data.balance);
    });

    socket.on('spin_result', (data: any) => {
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
