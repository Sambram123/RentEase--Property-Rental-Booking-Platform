import { loadRazorpayScript } from '../services/paymentService';

/**
 * Opens Razorpay checkout popup.
 * Returns a promise that resolves with payment response or rejects on failure/dismiss.
 */
export const openRazorpayCheckout = async ({
  orderId,
  amount,
  keyId,
  user,
  propertyTitle,
  onSuccess,
  onFailure,
}) => {
  const loaded = await loadRazorpayScript();
  if (!loaded) {
    throw new Error('Failed to load Razorpay. Check your internet connection.');
  }

  const key = keyId || import.meta.env.VITE_RAZORPAY_KEY_ID;
  if (!key) {
    throw new Error('Razorpay key is not configured');
  }

  return new Promise((resolve, reject) => {
    const options = {
      key,
      amount: amount * 100,
      currency: 'INR',
      name: 'RentEase',
      description: propertyTitle ? `Advance for ${propertyTitle}` : 'Booking advance payment',
      order_id: orderId,
      prefill: {
        name: user?.name || '',
        email: user?.email || '',
      },
      theme: { color: '#6366f1' },
      handler: (response) => {
        onSuccess?.(response);
        resolve(response);
      },
      modal: {
        ondismiss: () => {
          const err = new Error('Payment cancelled');
          err.code = 'PAYMENT_CANCELLED';
          onFailure?.(err);
          reject(err);
        },
      },
    };

    const rzp = new window.Razorpay(options);
    rzp.on('payment.failed', (response) => {
      const err = new Error(response.error?.description || 'Payment failed');
      err.code = 'PAYMENT_FAILED';
      err.razorpayResponse = response;
      onFailure?.(err);
      reject(err);
    });
    rzp.open();
  });
};
