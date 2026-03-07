import apiClient from '@/lib/api-client';

export interface SubscriptionPayload {
  packageId: string;
  billingCycle: 'monthly' | 'yearly';
}

export interface PaymentInitResponse {
  authorization_url: string;
  access_code: string;
  reference: string;
}

export interface EventPaymentPayload {
  eventId: string;
  amount: number;
  email: string;
}

export const paymentService = {
  initiateSubscription: async (payload: SubscriptionPayload): Promise<PaymentInitResponse> => {
    const { data } = await apiClient.post('/payments/subscribe-package', payload);
    return data.data;
  },
  
  initializePayment: async (payload: EventPaymentPayload) => {
    const { data } = await apiClient.post('/payments/purchase-ticket', payload);
    return data.data;
  },
};
