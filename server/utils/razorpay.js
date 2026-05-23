import Razorpay from 'razorpay';

const keyId = process.env.RAZORPAY_KEY_ID;
const keySecret = process.env.RAZORPAY_SECRET;

if (!keyId || !keySecret) {
  console.warn(
    '⚠️  RAZORPAY_KEY_ID or RAZORPAY_SECRET missing — payment APIs will not work until configured.'
  );
}

const razorpay = new Razorpay({
  key_id: keyId || 'placeholder',
  key_secret: keySecret || 'placeholder',
});

export { razorpay, keyId };
