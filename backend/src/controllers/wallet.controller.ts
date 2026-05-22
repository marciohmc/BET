import { Request, Response } from 'express';
import User from '../models/User';
import Transaction from '../models/Transaction';
import mongoose from 'mongoose';

const GM_SECRET = process.env.G_MACHINE_SECRET || 'asdsda@@4856@874874hbJHHHHH@@@@';

export const debit = async (req: Request, res: Response) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { userId, amount, secret } = req.body;

    // 1. Validate Secret
    if (secret !== GM_SECRET) {
      return res.status(401).json({ success: false, message: 'Unauthorized: Invalid G-Machine Secret' });
    }

    if (!userId || !amount || amount <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid data' });
    }

    // 2. Atomic Balance Deduction
    // Note: User.findOneAndUpdate works fine, but using a session for double safety with transaction record
    const user = await User.findOneAndUpdate(
      { _id: userId, balance: { $gte: amount } },
      { $inc: { balance: -amount } },
      { new: true, session }
    );

    if (!user) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ success: false, message: 'Insufficient balance or User not found' });
    }

    // 3. Create Transaction Record
    const balanceBefore = user.balance + amount;
    const transaction = new Transaction({
      userId: user._id,
      type: 'bet',
      amount,
      status: 'completed',
      balanceBefore,
      balanceAfter: user.balance,
      description: 'Game Bet (G-Machine)',
    });

    await transaction.save({ session });

    await session.commitTransaction();
    session.endSession();

    res.json({ success: true, balance: user.balance });
  } catch (error: any) {
    await session.abortTransaction();
    session.endSession();
    console.error('[Seamless-Wallet] Debit Error:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error', error: error.message });
  }
};

export const credit = async (req: Request, res: Response) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { userId, amount, secret } = req.body;

    // 1. Validate Secret
    if (secret !== GM_SECRET) {
      return res.status(401).json({ success: false, message: 'Unauthorized: Invalid G-Machine Secret' });
    }

    if (!userId || !amount || amount <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid data' });
    }

    // 2. Atomic Balance Addition
    const user = await User.findByIdAndUpdate(
      userId,
      { $inc: { balance: amount } },
      { new: true, session }
    );

    if (!user) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // 3. Create Transaction Record
    const balanceBefore = user.balance - amount;
    const transaction = new Transaction({
      userId: user._id,
      type: 'win',
      amount,
      status: 'completed',
      balanceBefore,
      balanceAfter: user.balance,
      description: 'Game Win (G-Machine)',
    });

    await transaction.save({ session });

    await session.commitTransaction();
    session.endSession();

    res.json({ success: true, balance: user.balance });
  } catch (error: any) {
    await session.abortTransaction();
    session.endSession();
    console.error('[Seamless-Wallet] Credit Error:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error', error: error.message });
  }
};
