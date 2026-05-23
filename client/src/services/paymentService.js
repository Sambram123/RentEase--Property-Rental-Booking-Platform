import api from './api';

export const createPaymentOrder = async (bookingId) => {
  const { data } = await api.post('/payments/create-order', { bookingId });
  return data.data;
};

export const verifyPayment = async (payload) => {
  const { data } = await api.post('/payments/verify', payload);
  return data.data;
};

export const fetchMyPayments = async () => {
  const { data } = await api.get('/payments/my-payments');
  return data.data;
};

export const fetchOwnerPayments = async () => {
  const { data } = await api.get('/payments/owner/payments');
  return data.data;
};

// Load Razorpay checkout script once
export const loadRazorpayScript = () =>
  new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
