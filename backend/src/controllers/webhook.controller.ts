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

  const payloadStr = rawBody.toString();
  console.log('PixGo Webhook Received. Payload:', payloadStr);

  const payload = JSON.parse(payloadStr);

  try {
    // Extract data from payload (trying both nested 'data' and root)
    const data = payload.data || payload;
    const external_id = data.external_id || data.reference_id || data.id;
    const amounts = data.amounts || { total: data.amount };
    const event = payload.event || data.status_event;

    console.log(`Processing event ${event} for transaction ${external_id}`);

    const transaction = await Transaction.findById(external_id);

    if (transaction) {
      if (event === 'payment.completed' || event === 'paid') {
        if (transaction.status === 'pending') {
          const user = await User.findById(transaction.userId);
          if (user) {
            transaction.status = 'completed';
            await transaction.save();

            // Credit the full amount planned in the transaction, 
            // or the total paid if preferred. 
            const creditAmount = amounts?.total || data.amount || transaction.amount;
            console.log(`Crediting ${creditAmount} to user ${user._id}`);

            // Atomic update for balance
            await User.updateOne(
              { _id: user._id },
              { $inc: { balance: creditAmount } }
            );
          }
        }
      } else if (event === 'payment.expired' || event === 'expired') {
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
