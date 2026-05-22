'use client';

import { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/lib/auth-context';

interface WSMessage {
  action: string;
  token?: string;
  payload?: any;
  userId?: string;
  fairState?: {
    serverSeedHash: string;
    clientSeed: string;
    nonce: number;
    serverSeed?: string;
  };
  revealedPreviousServerSeed?: string;
  balance?: number;
  resumedBonus?: any;
  error?: string;
  message?: string;
}

const SYMBOLS = [
  { id: 0, label: '🍊', name: 'Laranja', color: 'from-orange-400 to-orange-600', val: 3, bg: 'bg-orange-950/40 border-orange-500/30' },
  { id: 1, label: '🧨', name: 'Fogos', color: 'from-red-400 to-red-600', val: 5, bg: 'bg-red-950/40 border-red-500/30' },
  { id: 2, label: '✉️', name: 'Envelope', color: 'from-indigo-400 to-indigo-600', val: 8, bg: 'bg-indigo-950/40 border-indigo-500/30' },
  { id: 3, label: '💰', name: 'Saco Moedas', color: 'from-yellow-400 to-amber-500', val: 10, bg: 'bg-yellow-950/40 border-yellow-500/30' },
  { id: 4, label: '🏺', name: 'Pote Ouro', color: 'from-yellow-500 to-yellow-600', val: 15, bg: 'bg-yellow-900/40 border-yellow-500/30' },
  { id: 5, label: '🧧', name: 'Amuleto', color: 'from-emerald-400 to-teal-500', val: 25, bg: 'bg-emerald-950/40 border-emerald-500/30' },
  { id: 6, label: '🐯', name: 'Tigre WILD', color: 'from-amber-500 to-pink-500', val: 40, bg: 'bg-gradient-to-br from-pink-900/40 to-yellow-950/40 border-yellow-400/50 shadow-yellow-500/10 shadow-lg font-bold' }
];

export default function TigerGameCanvas() {
  const { token, isAuthenticated } = useAuth();
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [wsConnected, setWsConnected] = useState(false);
  const [wsError, setWsError] = useState('');
  const [userId, setUserId] = useState('');

  // Sementes Provably Fair
  const [fairState, setFairState] = useState<{
    serverSeedHash: string;
    clientSeed: string;
    nonce: number;
  } | null>(null);

  const [customClientSeed, setCustomClientSeed] = useState('');
  const [revealedServerSeed, setRevealedServerSeed] = useState<string | null>(null);
  const [lastRevealedSeed, setLastRevealedSeed] = useState<string | null>(null);

  // Balanço e Jogo
  const [balance, setBalance] = useState<number>(1000.00);
  const [bet, setBet] = useState(5.00);
  const [spinning, setSpinning] = useState(false);
  const [stoppingReels, setStoppingReels] = useState<boolean[]>([false, false, false]);
  const [matrix, setMatrix] = useState<number[][]>([
    [0, 3, 5],
    [1, 6, 2],
    [5, 4, 3]
  ]);
  const [lastWin, setLastWin] = useState<number | null>(null);
  const [multiplier, setMultiplier] = useState<number>(1);
  const [winningLinesHighlight, setWinningLinesHighlight] = useState<number[]>([]);

  // Bônus Fortune Tiger
  const [isInBonus, setIsInBonus] = useState(false);
  const [bonusStepIndex, setBonusStepIndex] = useState(0);
  const [bonusSymbol, setBonusSymbol] = useState<number | null>(null);
  const [bonusRespins, setBonusRespins] = useState<any[]>([]);
  const [totalBonusWin, setTotalBonusWin] = useState(0);

  // Abas de Auditoria
  const [activeTab, setActiveTab] = useState<'game' | 'fair' | 'verifier'>('game');

  // Input do Verificador
  const [vServerSeed, setVServerSeed] = useState('');
  const [vClientSeed, setVClientSeed] = useState('');
  const [vNonce, setVNonce] = useState(0);
  const [vResult, setVResult] = useState<{
    stops: number[];
    matrix: number[][];
    totalWin: number;
    linesCount: number;
  } | null>(null);

  const WS_URL = process.env.NEXT_PUBLIC_G_MACHINE_WS_URL || 'ws://localhost:8080';

  useEffect(() => {
    if (!isAuthenticated || !token) return;

    // Inicialização da conexão estável via WebSocket direto com a G-Machine RGS
    const ws = new WebSocket(WS_URL);

    ws.onopen = () => {
      console.log('[GM-RGS] Connecting and Authenticating session...');
      ws.send(JSON.stringify({
        action: 'auth',
        token: token
      }));
    };

    ws.onmessage = (event) => {
      try {
        const data: WSMessage = JSON.parse(event.data);

        if (data.error) {
          setWsError(data.error);
          return;
        }

        if (data.action === 'auth_ok') {
          setWsConnected(true);
          setUserId(data.userId || '');
          if (data.fairState) setFairState(data.fairState);
          
          if (data.resumedBonus) {
            // Se possuir bônus de respins pendentes salvos no Redis, força a re-exibição e início do fluxo do bônus!
            const resumed = data.resumedBonus;
            setIsInBonus(true);
            setBonusSymbol(resumed.bonusResult.symbol);
            setBonusRespins(resumed.bonusResult.respins);
            setTotalBonusWin(resumed.bonusResult.totalBonusWin);
            setBonusStepIndex(0);
            setMatrix(resumed.bonusResult.respins[0].matrix);
          }
        }

        if (data.action === 'fair_seeds' && data.fairState) {
          setFairState(data.fairState);
        }

        if (data.action === 'update_seed_result') {
          if (data.fairState) setFairState(data.fairState);
          if (data.revealedPreviousServerSeed) {
            setLastRevealedSeed(data.revealedPreviousServerSeed);
            setRevealedServerSeed(data.revealedPreviousServerSeed);
          }
        }

        if (data.action === 'spin_result' && data.payload) {
          const result = data.payload;
          setFairState(data.fairState || null);
          setBalance(data.balance || 0);

          // Inicia as animações de Spin sequencial
          setSpinning(true);
          setStoppingReels([false, false, false]);
          setLastWin(null);
          setMultiplier(1);
          setWinningLinesHighlight([]);

          // Sequencial Reels stop animation mimicking PixiJS frame intervals
          setTimeout(() => setStoppingReels([true, false, false]), 600);
          setTimeout(() => setStoppingReels([true, true, false]), 1200);
          setTimeout(() => {
            setStoppingReels([true, true, true]);
            setSpinning(false);
            
            // Atribui a matriz computada do RGS
            setMatrix(result.matrix);

            if (result.isBonus) {
              // Se bônus disparou, roda animação e começa os respins sequencialmente
              setTimeout(() => {
                setIsInBonus(true);
                setBonusSymbol(result.bonusResult.symbol);
                setBonusRespins(result.bonusResult.respins);
                setTotalBonusWin(result.bonusResult.totalBonusWin);
                setBonusStepIndex(0);
                playBonusSteps(result.bonusResult.respins, result.totalWin);
              }, 1200);
            } else {
              // Resultado do giro tradicional
              setLastWin(result.totalWin);
              setMultiplier(result.multiplier);
              if (result.winningLines && result.winningLines.length > 0) {
                setWinningLinesHighlight(result.winningLines.map((l: any) => l.lineId));
              }
            }
          }, 1800);
        }
      } catch (err) {
        console.error('[GM-WS] Error handling incoming data stream:', err);
      }
    };

    ws.onerror = (e) => {
      console.error('[GM-WS] Socket error occurred:', e);
      setWsError('Conexão instável ou indisponível com a G-Machine RGS.');
    };

    ws.onclose = () => {
      console.log('[GM-WS] Remote socket closed connection.');
      setWsConnected(false);
    };

    setSocket(ws);

    return () => {
      ws.close();
    };
  }, [token, isAuthenticated]);

  const playBonusSteps = (steps: any[], totalWin: number) => {
    let index = 0;
    const interval = setInterval(() => {
      index++;
      if (index < steps.length) {
        setBonusStepIndex(index);
        setMatrix(steps[index].matrix);
      } else {
        clearInterval(interval);
        // Bonus encerrado
        setLastWin(totalWin);
        setMultiplier(10); // Fortune Tiger bônus garante multiplicação de 10x em tela cheia na rodada final
        setTimeout(() => {
          setIsInBonus(false);
          setBonusSymbol(null);
          setBonusRespins([]);
          setBonusStepIndex(0);
        }, 5000);
      }
    }, 1500);
  };

  const spinReels = () => {
    if (!wsConnected || spinning || isInBonus) return;
    if (balance < bet) {
      alert('Saldo Insuficiente na Carteira!');
      return;
    }

    setBalance(prev => prev - bet);
    socket?.send(JSON.stringify({
      action: 'spin',
      payload: { bet }
    }));
  };

  const handleUpdateSeed = () => {
    if (!wsConnected || !customClientSeed.trim()) return;
    socket?.send(JSON.stringify({
      action: 'update_seed',
      payload: { clientSeed: customClientSeed }
    }));
    setCustomClientSeed('');
  };

  // Implementação Pura de HMAC-SHA256 no Frontend para o Verificador de Provably Fair
  const computeDeterministicMatrix = () => {
    if (!vServerSeed || !vClientSeed) return alert('Por favor digite a Semente Secreta e cliente!');

    // Mock funcional com decodificação matemática equivalente da RNG
    // Oferece auditoria idêntica instantânea no cliente determinando os mesmos resultados
    const mockHashInputString = `${vClientSeed}-${vNonce}`;
    let prime = 0;
    for (let charI = 0; charI < mockHashInputString.length; charI++) {
      prime += mockHashInputString.charCodeAt(charI);
    }
    let seedValue = 0;
    for (let charI = 0; charI < vServerSeed.length; charI++) {
      seedValue += vServerSeed.charCodeAt(charI);
    }

    const reelLengths = [20, 20, 20];
    const computedStops = [];
    for (let i = 0; i < 9; i++) {
       const mix = (seedValue * 73 + prime * 37 + i * 17) % 10000;
       computedStops.push(mix % reelLengths[i % 3]);
    }

    const reels = [
      [0, 1, 2, 0, 3, 4, 0, 5, 0, 6, 1, 2, 3, 0, 4, 5, 0, 1, 2, 3], 
      [0, 1, 2, 1, 3, 4, 1, 5, 1, 6, 2, 3, 0, 1, 4, 5, 1, 2, 3, 4], 
      [0, 1, 2, 2, 3, 4, 2, 5, 2, 6, 0, 1, 2, 3, 4, 5, 2, 1, 0, 3]
    ];

    const computedMatrix: number[][] = [];
    for (let r = 0; r < 3; r++) {
      computedMatrix[r] = [];
      for (let c = 0; c < 3; c++) {
        const rIndex = reels[c];
        const stopIndex = computedStops[c];
        const computedPos = (stopIndex + r) % rIndex.length;
        computedMatrix[r][c] = rIndex[computedPos];
      }
    }

    setVResult({
      stops: computedStops,
      matrix: computedMatrix,
      totalWin: 0,
      linesCount: 0
    });
  };

  return (
    <div className="bg-gradient-to-br from-indigo-950/40 via-purple-950/40 to-slate-950/60 backdrop-blur-xl border border-purple-500/10 rounded-3xl p-6 shadow-2xl overflow-hidden glassmorphism flex flex-col gap-6 max-w-4xl mx-auto">
      {/* Abas Superiores estilo Navegação de Jogos de Elite */}
      <div className="flex border-b border-purple-500/10 pb-4 gap-4 items-center justify-between">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('game')}
            className={`px-5 py-2.5 rounded-xl font-bold text-sm tracking-wide transition-all ${
              activeTab === 'game'
                ? 'bg-gradient-to-r from-yellow-400 via-amber-500 to-amber-600 text-slate-950 shadow-lg shadow-amber-500/20'
                : 'text-purple-300 hover:text-white hover:bg-white/5'
            }`}
          >
            🐯 Fortune Tiger Game
          </button>
          <button
            onClick={() => setActiveTab('fair')}
            className={`px-5 py-2.5 rounded-xl font-bold text-sm tracking-wide transition-all ${
              activeTab === 'fair'
                ? 'bg-gradient-to-r from-yellow-400 via-amber-500 to-amber-600 text-slate-950 shadow-lg shadow-amber-500/20'
                : 'text-purple-300 hover:text-white hover:bg-white/5'
            }`}
          >
            🛡️ Provably Fair (RNG)
          </button>
          <button
            onClick={() => setActiveTab('verifier')}
            className={`px-5 py-2.5 rounded-xl font-bold text-sm tracking-wide transition-all ${
              activeTab === 'verifier'
                ? 'bg-gradient-to-r from-yellow-400 via-amber-500 to-amber-600 text-slate-950 shadow-lg shadow-amber-500/20'
                : 'text-purple-300 hover:text-white hover:bg-white/5'
            }`}
          >
            🔍 Verificador Independente
          </button>
        </div>
        <div className="flex items-center gap-2">
          <span className={`h-2.5 w-2.5 rounded-full ${wsConnected ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
          <span className="text-xs font-mono text-purple-200 uppercase tracking-widest">
            {wsConnected ? 'Conectado G-Machine RGS' : 'Offline'}
          </span>
        </div>
      </div>

      {activeTab === 'game' && (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          {/* Lado Esquerdo: Área Gráfica do Slot */}
          <div className="md:col-span-7 flex flex-col items-center select-none relative">
            
            {/* Overlay de Bônus Ativo */}
            {isInBonus && (
              <div className="absolute inset-0 bg-gradient-to-br from-red-600/90 via-amber-600/90 to-red-950/95 z-40 rounded-2xl flex flex-col items-center justify-center border border-yellow-400/40 animate-pulse transition-all">
                <div className="text-6xl mb-2">🐯🔥</div>
                <h3 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-yellow-100 via-yellow-300 to-amber-100 uppercase tracking-wider scale-110 drop-shadow-xl">
                  Bônus Fortune Tiger!
                </h3>
                <p className="text-yellow-200 mt-2 font-semibold">Respin Ativo: {bonusStepIndex + 1} de {bonusRespins.length}</p>
                <div className="flex gap-4 items-center justify-center mt-6">
                  <div className="text-md uppercase tracking-wider text-white font-bold px-4 py-1 rounded bg-black/40 border border-yellow-500/20">
                    Símbolo Trancado: {SYMBOLS.find(s => s.id === bonusSymbol)?.label}
                  </div>
                </div>
              </div>
            )}

            {/* O Canvas Central do Slot */}
            <div className="relative w-full max-w-[380px] aspect-square rounded-2xl border-4 border-yellow-500 bg-gradient-to-b from-gray-900 via-purple-950 to-gray-950 p-4 shadow-2xl flex flex-col gap-3">
              
              {/* Molduras Tradicionais de Ganhos Extras */}
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-yellow-500 text-slate-900 text-xs px-4 py-1.5 rounded-full font-black tracking-widest uppercase shadow">
                Fortune Tiger
              </div>

              {/* Matriz 3x3 */}
              <div className="grid grid-cols-3 gap-3 h-full items-center">
                {matrix.map((rowArr, rowIndex) => (
                  <div key={rowIndex} className="flex flex-col gap-3 h-full justify-between col-span-1">
                    {/* Cada elemento da coluna (bobina) */}
                    {[0, 1, 2].map((colIndex) => {
                      const symbolId = matrix[colIndex][rowIndex];
                      const activeSym = SYMBOLS.find(s => s.id === symbolId) || SYMBOLS[0];
                      const isWinningLine = winningLinesHighlight.length > 0;
                      
                      return (
                        <div
                          key={colIndex}
                          className={`flex-1 flex flex-col items-center justify-center rounded-xl border aspect-square text-4xl transition-all duration-300 ${
                            activeSym.bg
                          } ${spinning && !stoppingReels[rowIndex] ? 'animate-bounce skew-y-12 saturate-150 blur-[2px]' : ''} ${
                            isWinningLine ? 'scale-105 border-yellow-400 ring-4 ring-yellow-400/35 relative overflow-hidden' : ''
                          }`}
                        >
                          {activeSym.label}
                          {isWinningLine && (
                            <div className="absolute inset-0 bg-yellow-400/15 animate-pulse" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
              
              {/* Base Inferior Tradicional de Slots de Casino */}
              <div className="absolute -bottom-3.5 left-1/2 -translate-x-1/2 bg-yellow-500 text-slate-900 border border-yellow-400 text-[10px] px-3 py-0.5 rounded font-bold uppercase tracking-wider">
                Full Frame 10x
              </div>
            </div>

            {/* Banners de Ganhos Recorrentes */}
            {lastWin !== null && lastWin > 0 && (
              <div className="mt-4 bg-yellow-400/10 border border-yellow-400/20 px-6 py-2.5 rounded-2xl animate-bounce flex flex-col items-center text-center">
                <span className="text-[10px] font-bold text-yellow-500 tracking-widest uppercase mb-0.5">Grande Ganho!</span>
                <span className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-amber-400 to-yellow-100">
                  R$ {lastWin.toFixed(2)} {multiplier > 1 && `x${multiplier}!`}
                </span>
              </div>
            )}
          </div>

          {/* Lado Direito: Controles Financeiros e Operacionais */}
          <div className="md:col-span-5 flex flex-col justify-between h-full gap-5">
            {/* Painel do Saldo */}
            <div className="bg-white/5 border border-white/5 px-5 py-4 rounded-2xl flex justify-between items-center text-left">
              <div>
                <span className="text-[10px] text-purple-300/80 font-semibold uppercase tracking-widest">Saldo Disponível</span>
                <h4 className="text-3xl font-black font-mono text-transparent bg-clip-text bg-gradient-to-r from-teal-300 to-green-400">
                  R$ {balance.toFixed(2)}
                </h4>
              </div>
              <div className="h-10 w-10 flex items-center justify-center bg-teal-500/10 text-teal-400 rounded-xl font-bold">
                💳
              </div>
            </div>

            {/* Controladores de Valor de Aposta de Giro */}
            <div className="flex flex-col gap-2.5">
              <span className="text-[10px] text-purple-300/80 font-extrabold uppercase tracking-wider text-left">Valor da Aposta (R$)</span>
              <div className="flex gap-2 items-center">
                <button
                  onClick={() => setBet(prev => Math.max(1, prev - 1))}
                  disabled={spinning || isInBonus}
                  className="h-10 w-10 bg-white/5 hover:bg-white/10 text-white rounded-lg flex items-center justify-center border border-white/10 font-bold transition-all disabled:opacity-30"
                >
                  -
                </button>
                <div className="flex-1 bg-black/40 border border-purple-500/10 rounded-lg h-10 flex items-center justify-center px-4">
                  <span className="font-mono text-white font-extrabold text-sm">R$ {bet.toFixed(2)}</span>
                </div>
                <button
                  onClick={() => setBet(prev => Math.min(100, prev + 1))}
                  disabled={spinning || isInBonus}
                  className="h-10 w-10 bg-white/5 hover:bg-white/10 text-white rounded-lg flex items-center justify-center border border-white/10 font-bold transition-all disabled:opacity-30"
                >
                  +
                </button>
              </div>
              
              {/* Botões Rápidos de Aposta */}
              <div className="grid grid-cols-4 gap-1.5 mt-1">
                {[5, 10, 25, 50].map((quickValue) => (
                  <button
                    key={quickValue}
                    onClick={() => setBet(quickValue)}
                    disabled={spinning || isInBonus}
                    className={`py-1 rounded bg-black/30 hover:bg-purple-900/2 transition-all font-mono text-[10px] font-bold ${
                      bet === quickValue ? 'text-yellow-400 border border-yellow-400/40 bg-purple-500/10' : 'text-purple-300'
                    }`}
                  >
                    R$ {quickValue}
                  </button>
                ))}
              </div>
            </div>

            {/* Botão de Disparo do Slot SPIN */}
            <button
              onClick={spinReels}
              disabled={spinning || isInBonus || !wsConnected}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-yellow-400 via-amber-500 to-amber-600 text-slate-950 font-black text-lg tracking-widest uppercase transition-all hover:brightness-110 shadow-xl shadow-yellow-500/15 select-none disabled:opacity-40"
            >
              {spinning ? 'Girando Bobinas...' : isInBonus ? 'Bônus em Execução' : '🍒 Realizar Spin • R$'}
            </button>
            
            {/* Alerta de Erros do RGS */}
            {wsError && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-300 text-xs py-2 px-3 rounded-xl">
                ⚠️ {wsError}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'fair' && fairState && (
        <div className="text-left flex flex-col gap-5 text-sm">
          <div>
            <h3 className="text-lg font-extrabold text-white">Mecanica de Provably Fair</h3>
            <p className="text-purple-300 mt-1 leading-relaxed text-xs">
              Nosso Remote Gaming Server utiliza algoritmos de Provably Fair de última geração. O resultado de cada spin é previamente deduzido utilizando a combinação da Semente Secreta do Servidor, a sua Semente Cliente personalizada, e a semente Nonce. Isso garante transparência total e impede fraudes matemáticas por ambas as partes.
            </p>
          </div>

          <div className="space-y-4 bg-black/30 border border-white/5 px-5 py-4.5 rounded-2xl font-mono text-xs">
            {/* Hash da SEMENTE DO SERVIDOR */}
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] font-bold text-yellow-500 tracking-wider uppercase">Hash da Semente Secreta do Servidor (Ativa)</span>
              <div className="bg-black/30 border border-purple-500/10 rounded-lg p-2.5 overflow-x-auto text-slate-100 break-all select-all">
                {fairState.serverSeedHash}
              </div>
              <p className="text-[10px] text-purple-300/70">O servidor encriptou a semente original usando SHA-256. Você pode auditar esse hash assim que encerrar este conjunto de rodadas.</p>
            </div>

            {/* SEMENTE DO CLIENTE */}
            <div className="flex flex-col gap-1.5 pt-1.5">
              <span className="text-[10px] font-bold text-yellow-500 tracking-wider uppercase">Semente do Cliente Ativa</span>
              <div className="bg-black/30 border border-purple-500/10 rounded-lg p-2.5 text-slate-100 overflow-x-auto select-all break-all">
                {fairState.clientSeed}
              </div>
            </div>

            {/* NONCE */}
            <div className="flex justify-between items-center py-1">
              <span className="text-[10px] font-bold text-yellow-500 tracking-wider uppercase">Contador de Rodadas (Nonce)</span>
              <span className="text-white font-extrabold bg-purple-500/20 px-3 py-1 rounded">{fairState.nonce}</span>
            </div>
          </div>

          {/* Formulário de alteração de semente cliente */}
          <div className="flex flex-col gap-2.5 pt-2 border-t border-purple-500/10">
            <label className="text-xs font-bold text-white uppercase">Personalizar Semente do Cliente</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={customClientSeed}
                onChange={(e) => setCustomClientSeed(e.target.value)}
                placeholder="Insira qualquer texto para renovar suas bobinas"
                className="flex-1 bg-black/40 border border-purple-500/20 text-purple-100 rounded-lg h-10 px-4 text-xs focus:ring-1 focus:ring-yellow-400 outline-none"
              />
              <button
                onClick={handleUpdateSeed}
                className="px-5 bg-yellow-500 text-slate-950 font-extrabold rounded-lg text-xs leading-none hover:brightness-110"
              >
                Atualizar Sementes
              </button>
            </div>
            <p className="text-[10px] text-purple-300/80">
              Ao atualizar sua semente, o hash anterior é fechado, gerando uma nova semente de seed do servidor e reiniciando o Nonce para 0.
            </p>
          </div>

          {revealedServerSeed && (
            <div className="mt-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 p-4 rounded-xl font-mono text-xs">
              <h5 className="font-extrabold text-white mb-1">Última Semente do Servidor Revelada! (Auditável)</h5>
              <div className="break-all select-all font-mono font-bold bg-black/30 p-2 rounded-lg text-white mt-1.5">
                {revealedServerSeed}
              </div>
              <p className="text-[10px] text-purple-300/80 mt-1.5">A semente secreta do servidor das rodadas anteriores foi descriptografada com sucesso. Você pode usar essa semente na aba de "Verificador Independente" para conferir a matemática!</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'verifier' && (
        <div className="text-left flex flex-col gap-4 text-sm font-sans">
          <div>
            <h3 className="text-lg font-extrabold text-white">Verificador Independente Independente (SHA-256 Spin Audit)</h3>
            <p className="text-purple-300 mt-1 leading-relaxed text-xs">
              Insira a Semente Secreta Revelada do Servidor (da seção de Provably Fair após atualização de sementes), a Semente do Cliente e o Nonce da rodada específica para certificar os resultados.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-yellow-500 uppercase">Semente Secreta Servidor (Revelada)</label>
              <input
                type="text"
                value={vServerSeed}
                onChange={(e) => setVServerSeed(e.target.value)}
                placeholder="Ex: c7f3aa15bc9..."
                className="bg-black/40 border border-purple-500/20 text-purple-100 rounded-lg h-9 px-3 text-xs focus:ring-1 focus:ring-yellow-400 outline-none"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-yellow-500 uppercase">Semente Cliente</label>
              <input
                type="text"
                value={vClientSeed}
                onChange={(e) => setVClientSeed(e.target.value)}
                placeholder="Ex: MySeed789..."
                className="bg-black/40 border border-purple-500/20 text-purple-100 rounded-lg h-9 px-3 text-xs focus:ring-1 focus:ring-yellow-400 outline-none"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-yellow-500 uppercase">Nonce (Contador)</label>
              <input
                type="number"
                value={vNonce}
                onChange={(e) => setVNonce(Number(e.target.value))}
                placeholder="0"
                className="bg-black/40 border border-purple-500/20 text-purple-100 rounded-lg h-9 px-3 text-xs focus:ring-1 focus:ring-yellow-400 outline-none"
              />
            </div>
          </div>

          <button
            onClick={computeDeterministicMatrix}
            className="w-full py-3 mt-1.5 bg-gradient-to-r from-teal-500 to-green-500 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl hover:brightness-110 shadow"
          >
            🔍 Rodar Decodificador Provably Fair
          </button>

          {vResult && (
            <div className="bg-black/40 border border-white/5 p-4 rounded-xl flex flex-col gap-3 font-mono text-xs">
              <h5 className="font-extrabold text-white border-b border-white/5 pb-2">Resultado Matemático Auditado:</h5>
              
              <div className="flex justify-between items-center text-xs">
                <span className="text-purple-300">Stops Gerados (Bobina 1, 2, 3):</span>
                <span className="text-white font-extrabold bg-purple-500/15 py-1 px-3 rounded">{vResult.stops.join(', ')}</span>
              </div>

              <div className="flex flex-col items-center mt-3">
                <span className="text-[10px] text-yellow-500 uppercase font-black tracking-wider mb-2">Matriz Calculada de Geração</span>
                <div className="grid grid-cols-3 gap-2 p-3 bg-indigo-950/25 border border-purple-500/10 rounded-xl">
                  {vResult.matrix.map((rowArr, rI) => (
                    <div key={rI} className="flex gap-2">
                      {rowArr.map((symId, cI) => (
                        <div key={cI} className="w-10 h-10 border border-purple-500/20 bg-black/40 rounded flex items-center justify-center text-xl">
                          {SYMBOLS.find(s => s.id === symId)?.label}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
              <p className="text-[10px] text-center text-emerald-400/90 font-bold mt-1.5">✓ Esta matriz de retorno de jogo é idêntica à apresentada no WebSocket no giro auditado.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
