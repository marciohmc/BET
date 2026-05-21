import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import Transaction from '../models/Transaction';
import User from '../models/User';
import { pixgoService } from '../services/pixgo.service';

export const getUserTransactions = async (req: AuthRequest, res: Response) => {
  try {
    const { type, status } = req.query;
    const filter: any = { userId: req.userId };

    if (type) filter.type = type;
    if (status) filter.status = status;

    const transactions = await Transaction.find(filter).sort({ createdAt: -1 }).limit(50);
    res.json(transactions);
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({ message: 'Failed to fetch transactions', error });
  }
};

export const createPixDeposit = async (req: AuthRequest, res: Response) => {
  try {
    const { amount, description } = req.body;

    if (!amount || amount < 10) {
      return res.status(400).json({ message: 'Amount must be at least 10 BRL' });
    }

    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // 1. Create a pending transaction in our DB
    const transaction: any = new Transaction({
      userId: req.userId,
      type: 'deposit',
      amount,
      status: 'pending',
      paymentMethod: 'pix',
      description: description || 'Pix Deposit',
    });
    
    await transaction.save();

    // 2. Call PixGo API
    const webhookUrl = `${process.env.APP_URL}/api/webhooks/pixgo`;
    const pixgoResponse = await pixgoService.createPayment(
      amount,
      description || 'Pix Deposit',
      transaction._id.toString(),
      webhookUrl
    );

    res.status(201).json({
      message: 'Pix payment initiated',
      transactionId: transaction._id,
      pixData: (pixgoResponse as any).data,
    });
  } catch (error) {
    console.error('Pix deposit error:', error);
    res.status(500).json({ message: 'Pix deposit failed', error: error instanceof Error ? error.message : error });
  }
};

export const createDeposit = async (req: AuthRequest, res: Response) => {
  try {
    const { amount, paymentMethod } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ message: 'Invalid deposit amount' });
    }

    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const balanceBefore = user.balance;
    const balanceAfter = balanceBefore + amount;

    const transaction = new Transaction({
      userId: req.userId,
      type: 'deposit',
      amount,
      status: 'completed',
      paymentMethod,
      balanceBefore,
      balanceAfter,
      description: `Deposit via ${paymentMethod}`,
    });

    await transaction.save();

    user.balance = balanceAfter;
    await user.save();

    res.status(201).json({ 
      message: 'Deposit successful', 
      transaction,
      newBalance: balanceAfter 
    });
  } catch (error) {
    console.error('Deposit error:', error);
    res.status(500).json({ message: 'Deposit failed', error });
  }
};

export const createWithdrawal = async (req: AuthRequest, res: Response) => {
  try {
    const { amount, paymentMethod } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ message: 'Invalid withdrawal amount' });
    }

    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.balance < amount) {
      return res.status(400).json({ message: 'Insufficient balance' });
    }

    if (user.kycStatus !== 'verified') {
      return res.status(400).json({ message: 'KYC verification required for withdrawals' });
    }

    const balanceBefore = user.balance;
    const balanceAfter = balanceBefore - amount;

    const transaction = new Transaction({
      userId: req.userId,
      type: 'withdrawal',
      amount,
      status: 'pending',
      paymentMethod,
      balanceBefore,
      balanceAfter,
      description: `Withdrawal via ${paymentMethod}`,
    });

    await transaction.save();

    user.balance = balanceAfter;
    await user.save();

    res.status(201).json({ 
      message: 'Withdrawal request submitted', 
      transaction,
      newBalance: balanceAfter 
    });
  } catch (error) {
    console.error('Withdrawal error:', error);
    res.status(500).json({ message: 'Withdrawal failed', error });
  }
};
