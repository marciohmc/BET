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
    const numericAmount = parseFloat(amount);

    if (!numericAmount || numericAmount < 10) {
      return res.status(400).json({ message: 'Amount must be a number at least 10 BRL' });
    }

    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const balanceBefore = user.balance;
    const balanceAfter = balanceBefore + numericAmount;

    // 1. Create a pending transaction in our DB
    const transaction: any = new Transaction({
      userId: req.userId,
      type: 'deposit',
      amount: numericAmount,
      status: 'pending',
      paymentMethod: 'pix',
      description: description || 'Pix Deposit',
      balanceBefore,
      balanceAfter,
    });
    
    await transaction.save();

    // 2. Call PixGo API
    try {
        const webhookUrl = `${process.env.APP_URL}/api/webhooks/pixgo`;
        console.log('Initiating PixGo payment with webhook:', webhookUrl);
        
        const pixgoResponse = await pixgoService.createPayment(
          numericAmount,
          description || 'Pix Deposit',
          transaction._id.toString(),
          webhookUrl
        );

        console.log('PixGo API Response structure:', JSON.stringify(pixgoResponse));

        // Handle various possible response formats from PixGo
        // Some versions return { data: { ... } }, others return the object directly
        const pixData = (pixgoResponse as any).data || pixgoResponse;

        // Fallback for field naming variations (qr_code vs qrcode, etc)
        const mappedPixData = {
          qr_code: pixData.qr_code || pixData.qrcode || pixData.code,
          qr_image_url: pixData.qr_image_url || pixData.qrcode_url || pixData.image_url,
          payment_id: pixData.payment_id || pixData.id
        };

        if (!mappedPixData.qr_code || !mappedPixData.qr_image_url) {
          console.warn('PixGo response missing critical fields:', mappedPixData);
        }

        res.status(201).json({
          message: 'Pix payment initiated',
          transactionId: transaction._id,
          pixData: mappedPixData,
        });
    } catch (apiError) {
        console.error('PixGo API error (detailed):', apiError);
        // Mark transaction as failed
        transaction.status = 'failed';
        await transaction.save();
        throw apiError; // re-throw to be caught by main catch
    }
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

    // Use atomic update to ensure balance doesn't drop below amount during concurrent requests
    const updatedUser = await User.findOneAndUpdate(
      { _id: req.userId, balance: { $gte: amount } },
      { $inc: { balance: -amount } },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(400).json({ message: 'Insufficient balance or concurrent transaction lock' });
    }

    const transaction = new Transaction({
      userId: req.userId,
      type: 'withdrawal',
      amount,
      status: 'pending',
      paymentMethod,
      balanceBefore,
      balanceAfter: updatedUser.balance,
      description: `Withdrawal via ${paymentMethod}`,
    });

    await transaction.save();

    res.status(201).json({ 
      message: 'Withdrawal request submitted', 
      transaction,
      newBalance: updatedUser.balance 
    });
  } catch (error) {
    console.error('Withdrawal error:', error);
    res.status(500).json({ message: 'Withdrawal failed', error });
  }
};

export const createPixWithdrawal = async (req: AuthRequest, res: Response) => {
  try {
    const { amount, pixKey, pixKeyType } = req.body;
    const numericAmount = parseFloat(amount);

    if (!numericAmount || numericAmount < 20) {
      return res.status(400).json({ message: 'Minimum withdrawal is 20 BRL' });
    }

    if (!pixKey || !pixKeyType) {
      return res.status(400).json({ message: 'Pix Key and Type are required' });
    }

    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Security check: KYC
    if (user.kycStatus !== 'verified') {
      return res.status(400).json({ message: 'KYC verification required for withdrawals' });
    }

    if (user.balance < numericAmount) {
      return res.status(400).json({ message: 'Insufficient balance' });
    }

    const balanceBefore = user.balance;

    // 1. Atomic balance deduction
    const updatedUser = await User.findOneAndUpdate(
      { _id: req.userId, balance: { $gte: numericAmount } },
      { $inc: { balance: -numericAmount } },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(400).json({ message: 'Insufficient balance or concurrent transaction lock' });
    }

    // 2. Create pending transaction
    const transaction = new Transaction({
      userId: req.userId,
      type: 'withdrawal',
      amount: numericAmount,
      status: 'pending',
      paymentMethod: 'pix',
      balanceBefore,
      balanceAfter: updatedUser.balance,
      description: `Pix Payout to ${pixKeyType}: ${pixKey}`,
    });

    await transaction.save();

    // 3. Call PixGo Payout API
    try {
      const pixgoResponse = await pixgoService.createPayout(
        numericAmount,
        pixKey,
        pixKeyType,
        transaction._id.toString()
      );

      res.status(201).json({
        message: 'Withdrawal processed',
        transactionId: transaction._id,
        newBalance: updatedUser.balance,
        pixgoStatus: pixgoResponse.status
      });
    } catch (payoutError) {
      console.error('PixGo Payout API error:', payoutError);
      // Note: In a production app, if the external API fails, we might want to refund the user 
      // or mark for manual review. For now, we'll keep it pending for manual correction.
      res.status(201).json({
        message: 'Withdrawal request recorded (API Delay)',
        transactionId: transaction._id,
        newBalance: updatedUser.balance,
        warning: 'The request was saved but execution via PixGo failed. Our support will review it.'
      });
    }
  } catch (error) {
    console.error('Pix withdrawal error:', error);
    res.status(500).json({ message: 'Pix withdrawal failed', error: error instanceof Error ? error.message : error });
  }
};
