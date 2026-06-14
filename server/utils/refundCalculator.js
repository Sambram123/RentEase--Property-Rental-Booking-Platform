/**
 * Centralized refund calculation utility
 *
 * Policies:
 *  flexible  — full refund if cancelled ≥7 days before check-in, 50% within 7 days
 *  moderate  — full refund if cancelled ≥14 days before, 50% 7-13 days, 25% 1-6 days, 0% same day
 *  strict    — 50% refund if cancelled ≥30 days before, 25% 15-29 days, 0% within 14 days
 */

/**
 * @param {string} policy - 'flexible' | 'moderate' | 'strict'
 * @param {Date|string} checkInDate
 * @param {number} paidAmount  - Amount actually paid (advance)
 * @param {number} totalAmount - Total booking amount
 * @returns {{ refundPercentage: number, refundAmount: number, daysBeforeCheckIn: number, breakdown: string }}
 */
export const calculateRefund = (policy, checkInDate, paidAmount, totalAmount) => {
  const now = new Date();
  const checkIn = new Date(checkInDate);
  const msPerDay = 1000 * 60 * 60 * 24;
  const daysBeforeCheckIn = Math.max(0, Math.ceil((checkIn - now) / msPerDay));

  let refundPercentage = 0;
  let breakdown = '';

  switch (policy) {
    case 'flexible':
      if (daysBeforeCheckIn >= 7) {
        refundPercentage = 100;
        breakdown = 'Full refund — cancelled ≥7 days before check-in';
      } else if (daysBeforeCheckIn >= 1) {
        refundPercentage = 50;
        breakdown = '50% refund — cancelled within 7 days of check-in';
      } else {
        refundPercentage = 25;
        breakdown = '25% refund — cancelled on check-in day';
      }
      break;

    case 'moderate':
      if (daysBeforeCheckIn >= 14) {
        refundPercentage = 100;
        breakdown = 'Full refund — cancelled ≥14 days before check-in';
      } else if (daysBeforeCheckIn >= 7) {
        refundPercentage = 50;
        breakdown = '50% refund — cancelled 7-13 days before check-in';
      } else if (daysBeforeCheckIn >= 1) {
        refundPercentage = 25;
        breakdown = '25% refund — cancelled 1-6 days before check-in';
      } else {
        refundPercentage = 0;
        breakdown = 'No refund — cancelled on check-in day or after';
      }
      break;

    case 'strict':
      if (daysBeforeCheckIn >= 30) {
        refundPercentage = 50;
        breakdown = '50% refund — cancelled ≥30 days before check-in';
      } else if (daysBeforeCheckIn >= 15) {
        refundPercentage = 25;
        breakdown = '25% refund — cancelled 15-29 days before check-in';
      } else {
        refundPercentage = 0;
        breakdown = 'No refund — cancelled within 14 days of check-in';
      }
      break;

    default:
      refundPercentage = 0;
      breakdown = 'Unknown policy — no refund';
  }

  // Refund is calculated on the amount actually paid
  const refundAmount = Math.round((paidAmount * refundPercentage) / 100);

  return { refundPercentage, refundAmount, daysBeforeCheckIn, breakdown };
};

/**
 * Get refund estimate for a booking (before it is cancelled)
 */
export const getRefundEstimate = (property, booking) => {
  const policy = property.cancellationPolicy || 'moderate';
  const paidAmount = booking.advancePaid || 0;
  const totalAmount = booking.totalAmount || 0;

  return calculateRefund(policy, booking.checkInDate, paidAmount, totalAmount);
};
