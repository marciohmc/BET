export interface SlotMatrix {
  symbols: number[][]; // 3x3 matrix
}

export interface PayLine {
  id: number;
  positions: [number, number][]; // [row, col]
}

export interface SpinResult {
  matrix: number[][];
  winningLines: WinningLine[];
  totalWin: number;
  bet: number;
  isBonus: boolean;
  bonusResult?: BonusResult;
  multiplier: number; // 1x or 10x
}

export interface WinningLine {
  lineId: number;
  symbol: number;
  count: number;
  payout: number;
}

export interface BonusResult {
  symbol: number;
  respins: BonusStep[];
  totalBonusWin: number;
}

export interface BonusStep {
  matrix: number[][];
  newLockedPositions: [number, number][];
  stepWin: number;
}

export enum GameAction {
  SPIN = 'spin',
  AUTH = 'auth',
  GET_FAIR = 'get_fair',
  UPDATE_SEED = 'update_seed'
}

export interface WSMessage {
  action: GameAction;
  token?: string;
  payload?: any;
}
