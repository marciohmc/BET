import { Response, Request } from 'express';
import { pixgoService } from '../services/pixgo.service';
import Transaction from '../models/Transaction';
import User from '../models/User';

export const handlePixGoWebhook = async (req: Request, res: Response) => {
  const timestamp = req.headers['x-webhook-timestamp'] as string;
  const signature = req.headers['x-webhook-signature'] as string;
  const rawBody = req.body; // Assuming express.raw middleware

  if (!timestamp || !signature || !rawBody) {
    return res.status(401).send('Missing headers or body');
  }

  // Verify signature
  const isValid = pixgoService.verifyWebhookSignature(timestamp, rawBody.toString(), signature);
  if (!isValid) {
    return res.status(401).send('Invalid signature');
  }

  // Protecao contra replay attack (5 min)
  if (Math.abs(Date.now() / 1000 - parseInt(timestamp)) > 300) {
    return res.status(401).send('Timestamp expirado');
  }

  const payload = JSON.parse(rawBody.toString());

  try {
    const { external_id, amounts, status } = payload.data;
    const transaction = await Transaction.findById(external_id);

    if (transaction) {
      if (payload.event === 'payment.completed') {
        if (transaction.status === 'pending') {
          const user = await User.findById(transaction.userId);
          if (user) {
            transaction.status = 'completed';
            await transaction.save();

            user.balance += amounts.net;
            await user.save();
          }
        }
      } else if (payload.event === 'payment.expired') {
        transaction.status = 'expired';
        await transaction.save();
      } else if (payload.event === 'payment.refunded') {
        transaction.status = 'refunded';
        await transaction.save();
        // Optional: handle user balance deduction if needed
      }
    }

    res.status(200).send('Webhook received');
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).send('Internal server error');
  }
};
