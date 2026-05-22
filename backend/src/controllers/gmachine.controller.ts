import { Request, Response } from 'express';
import User from '../models/User';
import Transaction from '../models/Transaction';
import mongoose from 'mongoose';

/**
 * G-Machine Seamless Wallet Controller
 * This handles the financial synchronization between the game engine and the user's balance.
 */
export const processGameAction = async (req: Request, res: Response) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { userId, betAmount, winAmount, gameSlug, transactionId } = req.body;
    
    // In a production environment, we would verify a HMAC signature here
    // checking process.env.G_MACHINE_SECRET
    
    const user = await User.findById(userId).session(session);
    if (!user) {
      throw new Error('User not found');
    }

    if (user.balance < betAmount) {
      throw new Error('Insufficient balance');
    }

    const balanceBefore = user.balance;
    const balanceAfter = balanceBefore - betAmount + winAmount;

    // 1. Update User Balance
    user.balance = balanceAfter;
    await user.save({ session });

    // 2. Record Transaction
    const transaction = new Transaction({
      userId,
      type: winAmount > 0 ? 'win' : 'bet',
      amount: winAmount > 0 ? winAmount : betAmount,
      status: 'completed',
      paymentMethod: 'internal',
      balanceBefore,
      balanceAfter,
      description: `Game: ${gameSlug} | Bet: ${betAmount} | Win: ${winAmount}`,
      metadata: {
        gameSlug,
        externalTransactionId: transactionId
      }
    });
    await transaction.save({ session });

    await session.commitTransaction();
    
    res.json({
      success: true,
      newBalance: balanceAfter,
      transactionId: transaction._id
    });

  } catch (error: any) {
    await session.abortTransaction();
    console.error('G-Machine Sync Error:', error.message);
    res.status(400).json({ success: false, message: error.message });
  } finally {
    session.endSession();
  }
};
