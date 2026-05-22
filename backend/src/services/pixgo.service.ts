import crypto from 'crypto';

export const pixgoService = {
  createPayment: async (amount: number, description: string, externalId: string, webhookUrl: string) => {
    const response = await fetch('https://pixgo.org/api/v1/payment/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': process.env.PIXGO_API_KEY as string,
      },
      body: JSON.stringify({
        amount,
        description,
        external_id: externalId,
        webhook_url: webhookUrl,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`PixGo API error: ${JSON.stringify(errorData)}`);
    }

    return response.json();
  },

  checkStatus: async (paymentId: string) => {
    const response = await fetch(`https://pixgo.org/api/v1/payment/${paymentId}/status`, {
      method: 'GET',
      headers: {
        'X-API-Key': process.env.PIXGO_API_KEY as string,
      },
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`PixGo API error: ${JSON.stringify(errorData)}`);
    }

    return response.json();
  },

  getDetails: async (paymentId: string) => {
    const response = await fetch(`https://pixgo.org/api/v1/payment/${paymentId}`, {
      method: 'GET',
      headers: {
        'X-API-Key': process.env.PIXGO_API_KEY as string,
      },
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`PixGo API error: ${JSON.stringify(errorData)}`);
    }

    return response.json();
  },
  
  verifyWebhookSignature: (timestamp: string, payload: string, signature: string) => {
    const WEBHOOK_SECRET = process.env.PIXGO_WEBHOOK_SECRET as string;
    
    const signaturePayload = timestamp + '.' + payload;
    const expected = crypto
        .createHmac('sha256', WEBHOOK_SECRET)
        .update(signaturePayload)
        .digest('hex');

    return crypto.timingSafeEqual(
        Buffer.from(expected, 'hex'),
        Buffer.from(signature, 'hex')
    );
  },

  createPayout: async (amount: number, pixKey: string, pixKeyType: string, externalId: string) => {
    const response = await fetch('https://pixgo.org/api/v1/payout/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': process.env.PIXGO_API_KEY as string,
      },
      body: JSON.stringify({
        amount,
        pix_key: pixKey,
        pix_key_type: pixKeyType, // e.g., 'cpf', 'email', 'phone', 'random'
        external_id: externalId,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`PixGo Payout error: ${JSON.stringify(errorData)}`);
    }

    return response.json();
  }
};
