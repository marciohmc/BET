'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, RotateCcw, ShieldCheck, Coins, Trophy, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { cn } from '@/lib/utils';

// Symbols Mapping to Emojis/Icons for the Prototype
const SYMBOL_MAP: Record<string, string> = {
  tiger_gold: '🐯',
  tiger_red: '🧧',
  tiger_blue: '🏮',
  coin: '💰',
  envelope: '🧧',
  orange: '🍊'
};

const GM_URL = 'http://localhost:6000';

export default function TigerGame() {
  const { user, updateBalance } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [matrix, setMatrix] = useState([['🍊', '🍊', '🍊'], ['🍊', '🍊', '🍊'], ['🍊', '🍊', '🍊']]);
  const [win, setWin] = useState(0);
  const [bet, setBet] = useState(1);
  const [nonce, setNonce] = useState(0);
  const [serverSeedHash, setServerSeedHash] = useState('');
  const [clientSeed, setClientSeed] = useState('cassanova-player');
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    const newSocket = io(GM_URL);
    setSocket(newSocket);

    newSocket.on('connect', () => {
      if (user) {
        newSocket.emit('join_game', { userId: user.id, gameSlug: 'tiger-original' });
      }
    });

    newSocket.on('game_ready', (data) => {
      setServerSeedHash(data.serverSeedHash);
    });

    newSocket.on('spin_result', (data) => {
      // Simulate delayer spinning animation
      setTimeout(() => {
        setMatrix(data.matrix);
        setWin(data.win);
        setNonce(data.newNonce);
        setServerSeedHash(data.serverSeedHash);
        setIsSpinning(false);
        
        if (data.newBalance !== undefined) {
          updateBalance(data.newBalance);
        }
        
        if (data.win > 0) {
          setFeedback(`Você ganhou R$ ${data.win.toFixed(2)}!`);
        } else {
          setFeedback(null);
        }
      }, 800);
    });

    newSocket.on('error', (data) => {
      alert(data.message);
      setIsSpinning(false);
    });

    return () => {
      newSocket.disconnect();
    };
  }, [user, updateBalance]);

  const handleSpin = useCallback(() => {
    if (!socket || isSpinning || !user || user.balance < bet) return;

    setIsSpinning(true);
    setWin(0);
    setFeedback(null);
    
    socket.emit('spin', {
      userId: user.id,
      bet,
      clientSeed,
      nonce
    });
  }, [socket, isSpinning, user, bet, clientSeed, nonce]);

  return (
    <div className="min-h-screen bg-[#0f0714] text-white p-4 md:p-8 flex flex-col items-center justify-center font-sans">
      {/* Header Info */}
      <div className="w-full max-w-lg mb-8 flex items-center justify-between bg-white/5 backdrop-blur-md rounded-2xl p-4 border border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-600 to-pink-500 flex items-center justify-center">
            <Trophy className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-xs text-gray-400">Saldo Atual</p>
            <p className="text-lg font-bold text-yellow-500">R$ {user?.balance?.toFixed(2) || '0.00'}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-400">Tiger Original</p>
          <p className="text-sm font-medium text-purple-400 flex items-center gap-1 justify-end">
            <ShieldCheck className="w-4 h-4" /> Provably Fair
          </p>
        </div>
      </div>

      {/* Game Stage */}
      <div className="relative w-full max-w-md aspect-square bg-gradient-to-b from-purple-900/40 to-[#1a0b2e]/60 rounded-3xl border-4 border-yellow-600/30 shadow-[0_0_50px_rgba(147,51,234,0.2)] overflow-hidden flex items-center justify-center p-4">
        
        {/* Slot Grid */}
        <div className="grid grid-cols-3 gap-2 w-full h-full">
          {matrix.map((reel, r) => (
            <div key={r} className="flex flex-col gap-2 h-full">
              {reel.map((symbol, i) => (
                <motion.div
                  key={`${r}-${i}-${nonce}`}
                  initial={{ y: isSpinning ? -100 : 0, opacity: isSpinning ? 0 : 1 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ 
                    duration: 0.5, 
                    delay: r * 0.1 + i * 0.05,
                    type: 'spring',
                    stiffness: 100
                  }}
                  className="flex-1 bg-white/5 rounded-xl flex items-center justify-center text-4xl sm:text-6xl border border-white/5 shadow-inner"
                >
                  {isSpinning ? '🎰' : (SYMBOL_MAP[symbol] || symbol)}
                </motion.div>
              ))}
            </div>
          ))}
        </div>

        {/* Win Overlay */}
        <AnimatePresence>
          {win > 0 && !isSpinning && (
            <motion.div 
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              className="absolute inset-0 flex flex-col items-center justify-center bg-purple-900/60 backdrop-blur-sm z-10"
            >
              <motion.div
                animate={{ y: [0, -20, 0] }}
                transition={{ repeat: Infinity, duration: 1 }}
              >
                 <Trophy className="w-20 h-20 text-yellow-400 mb-2" />
              </motion.div>
              <h2 className="text-4xl font-black text-yellow-400 drop-shadow-[0_0_10px_rgba(250,204,21,0.5)]">
                BIG WIN!
              </h2>
              <p className="text-2xl font-bold">+ R$ {win.toFixed(2)}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Controls */}
      <div className="w-full max-w-lg mt-8 flex flex-col gap-6">
        {/* Bet Controls */}
        <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-gray-400 flex items-center gap-2">
              <Coins className="w-4 h-4" /> Valor da Aposta
            </span>
            <span className="text-lg font-bold">R$ {bet.toFixed(2)}</span>
          </div>
          <div className="flex gap-2">
            {[1, 5, 10, 50].map((val) => (
              <button
                key={val}
                onClick={() => setBet(val)}
                className={cn(
                  "flex-1 py-3 rounded-xl font-bold transition-all border",
                  bet === val 
                    ? "bg-yellow-500 text-black border-yellow-400" 
                    : "bg-white/10 hover:bg-white/20 border-white/10"
                )}
              >
                {val}
              </button>
            ))}
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={handleSpin}
          disabled={isSpinning || (user?.balance || 0) < bet}
          className={cn(
            "w-full py-5 rounded-2xl font-black text-xl flex items-center justify-center gap-3 transition-all shadow-[0_10px_20px_rgba(0,0,0,0.3)]",
            isSpinning || (user?.balance || 0) < bet
              ? "bg-gray-700 cursor-not-allowed text-gray-400"
              : "bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 text-black hover:scale-[1.02] active:scale-[0.98]"
          )}
        >
          {isSpinning ? (
            <>
              <RotateCcw className="w-6 h-6 animate-spin" /> GIRANDO...
            </>
          ) : (
            <>
              <Play className="w-6 h-6 fill-current" /> JOGAR AGORA
            </>
          )}
        </button>

        {/* Integrity / Debug info */}
        <div className="grid grid-cols-2 gap-4">
           <div className="bg-white/5 rounded-xl p-3 border border-white/5 text-[10px] opacity-60 overflow-hidden">
              <p className="text-gray-400 uppercase tracking-tighter mb-1 font-bold">Server Seed Hash</p>
              <p className="truncate font-mono">{serverSeedHash}</p>
           </div>
           <div className="bg-white/5 rounded-xl p-3 border border-white/5 text-[10px] opacity-60">
              <p className="text-gray-400 uppercase tracking-tighter mb-1 font-bold">Nonce / Rodada</p>
              <p className="font-mono">#{nonce}</p>
           </div>
        </div>
      </div>
    </div>
  );
}
