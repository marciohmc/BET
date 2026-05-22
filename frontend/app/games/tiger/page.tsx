'use client';

import React, { useState } from 'react';
import { useGame } from '@/lib/hooks/use-game';
import { motion, AnimatePresence } from 'motion/react';
import { Coins, Play, AlertCircle, TrendingUp } from 'lucide-react';
import Link from 'next/link';

export default function TigerGamePage() {
  const { balance, isSpinning, lastResult, error, spin, user } = useGame('tiger');
  const [bet, setBet] = useState(1.00);

  const handleSpin = () => {
    if (balance < bet) return;
    spin(bet);
  };

  return (
    <div className="min-h-screen bg-[#0f0a1e] text-white p-4 flex flex-col items-center">
      {/* Header */}
      <header className="w-full max-w-4xl flex justify-between items-center mb-8 bg-[#1a142d]/80 p-4 rounded-2xl border border-purple-500/20 backdrop-blur-md">
        <Link href="/dashboard" className="text-xl font-bold bg-gradient-to-r from-orange-400 to-red-600 bg-clip-text text-transparent">
          CASSANOVA
        </Link>
        <div className="flex items-center gap-4">
          <div className="bg-black/40 px-4 py-2 rounded-xl border border-yellow-500/30 flex items-center gap-2">
            <Coins className="text-yellow-500 size-4" />
            <span className="font-mono font-bold">R$ {balance.toFixed(2)}</span>
          </div>
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-600 to-pink-600 flex items-center justify-center border border-white/20">
            {user?.username?.charAt(0).toUpperCase()}
          </div>
        </div>
      </header>

      {/* Game Area */}
      <main className="flex-1 w-full max-w-4xl flex flex-col items-center justify-center space-y-8">
        <h1 className="text-4xl md:text-6xl font-black text-center tracking-tighter italic">
          FORTUNE <span className="text-orange-500">TIGER</span>
        </h1>

        {/* Slot Machine Visualization */}
        <div className="relative p-6 bg-gradient-to-b from-red-900/40 to-black/60 rounded-[40px] border-4 border-yellow-600 shadow-[0_0_50px_rgba(234,179,8,0.2)]">
          <div className="grid grid-cols-3 gap-4 bg-black/40 p-4 rounded-3xl overflow-hidden min-w-[300px] h-[300px]">
            {lastResult?.matrix ? (
              lastResult.matrix.map((reel: string[], i: number) => (
                <div key={i} className="flex flex-col gap-4">
                  {reel.map((symbol, j) => (
                    <motion.div
                      key={`${i}-${j}`}
                      initial={{ y: -50, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: i * 0.1 + j * 0.05 }}
                      className="h-20 flex items-center justify-center bg-white/5 rounded-xl border border-white/10 text-2xl"
                    >
                      {symbol === 'tiger_wild' && '🐯'}
                      {symbol === 'gold_ingot' && '💰'}
                      {symbol === 'red_envelope' && '🧧'}
                      {symbol === 'orange' && '🍊'}
                      {symbol === 'firecracker' && '🧨'}
                    </motion.div>
                  ))}
                </div>
              ))
            ) : (
              // Empty State
              [0, 1, 2].map((i) => (
                <div key={i} className="flex flex-col gap-4 opacity-20">
                  {[0, 1, 2].map((j) => (
                    <div key={j} className="h-20 bg-white/10 rounded-xl" />
                  ))}
                </div>
              ))
            )}
          </div>

          {/* Winning Banner */}
          <AnimatePresence>
            {lastResult?.totalWin > 0 && !isSpinning && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                className="absolute inset-0 flex items-center justify-center pointer-events-none"
              >
                <div className="bg-yellow-500 text-black px-8 py-4 rounded-full font-black text-3xl shadow-[0_0_40px_rgba(234,179,8,1)] animate-bounce border-4 border-white">
                  WIN: R$ {lastResult.totalWin.toFixed(2)}!
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Controls */}
        <div className="w-full max-w-sm space-y-6 bg-[#1a142d] p-6 rounded-3xl border border-white/10">
          <div className="flex justify-between items-center bg-black/40 p-3 rounded-2xl">
            <button 
              onClick={() => setBet(prev => Math.max(0.5, prev - 0.5))} 
              className="px-4 py-2 bg-white/5 rounded-lg hover:bg-white/10 transition-colors"
            >-</button>
            <div className="text-center">
              <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Aposta Total</p>
              <p className="font-mono text-xl font-bold">R$ {bet.toFixed(2)}</p>
            </div>
            <button 
              onClick={() => setBet(prev => prev + 0.5)} 
              className="px-4 py-2 bg-white/5 rounded-lg hover:bg-white/10 transition-colors"
            >+</button>
          </div>

          <button
            onClick={handleSpin}
            disabled={isSpinning || balance < bet}
            className={`w-full py-6 rounded-2xl font-black text-2xl flex items-center justify-center gap-3 transition-all transform active:scale-95 ${
              isSpinning 
                ? 'bg-gray-700 cursor-not-allowed' 
                : 'bg-gradient-to-r from-orange-500 to-red-600 hover:shadow-[0_0_30px_rgba(234,88,12,0.4)] shadow-xl'
            }`}
          >
            {isSpinning ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
              >
                <TrendingUp className="size-8" />
              </motion.div>
            ) : (
              <>
                <Play fill="currentColor" className="size-8" />
                GIRAR
              </>
            )}
          </button>

          {error && (
            <div className="bg-red-500/20 border border-red-500/50 p-3 rounded-xl flex items-center gap-2 text-red-500 text-sm">
              <AlertCircle size={16} />
              {error}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
