export interface Payment {
  id: string;
  orderId: string;
  amount: number;
  method: 'card' | 'paypal' | 'stripe';
  status: 'pending' | 'completed' | 'failed';
  transactionId?: string;
}
