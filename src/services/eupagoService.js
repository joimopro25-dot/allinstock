import { getFunctions, httpsCallable } from 'firebase/functions';

const functions = getFunctions();

/**
 * Create MB WAY Payment
 * @param {Object} paymentData - Payment information
 * @param {number} paymentData.amount - Payment amount in EUR
 * @param {string} paymentData.phoneNumber - Phone number for MB WAY (9 digits, e.g., "912345678")
 * @param {string} paymentData.planId - Selected plan ID
 * @param {string} paymentData.userId - User ID
 * @param {string} paymentData.companyId - Company ID (optional)
 * @param {string} paymentData.promoCode - Promo code (optional)
 * @returns {Promise<Object>} Payment reference and details
 */
export const createMbWayPayment = async (paymentData) => {
  try {
    const createPayment = httpsCallable(functions, 'createMbWayPayment');
    const result = await createPayment(paymentData);

    if (result.data.success) {
      return {
        success: true,
        paymentId: result.data.paymentId,
        reference: result.data.reference,
        amount: result.data.amount,
        discountApplied: result.data.discountApplied,
        message: 'MB WAY payment created successfully. Please check your phone to authorize the payment.'
      };
    } else {
      throw new Error('Failed to create MB WAY payment');
    }
  } catch (error) {
    console.error('Error creating MB WAY payment:', error);
    throw new Error(error.message || 'Failed to create MB WAY payment. Please try again.');
  }
};

/**
 * Create Multibanco Payment Reference
 * @param {Object} paymentData - Payment information
 * @param {number} paymentData.amount - Payment amount in EUR
 * @param {string} paymentData.planId - Selected plan ID
 * @param {string} paymentData.userId - User ID
 * @param {string} paymentData.companyId - Company ID (optional)
 * @param {string} paymentData.promoCode - Promo code (optional)
 * @returns {Promise<Object>} Multibanco entity and reference
 */
export const createMultibancoPayment = async (paymentData) => {
  try {
    const createPayment = httpsCallable(functions, 'createMultibancoPayment');
    const result = await createPayment(paymentData);

    if (result.data.success) {
      return {
        success: true,
        paymentId: result.data.paymentId,
        entity: result.data.entity,
        reference: result.data.reference,
        amount: result.data.amount,
        discountApplied: result.data.discountApplied,
        message: 'Multibanco reference generated successfully. Please use the provided entity and reference to complete the payment.'
      };
    } else {
      throw new Error('Failed to create Multibanco reference');
    }
  } catch (error) {
    console.error('Error creating Multibanco payment:', error);
    throw new Error(error.message || 'Failed to create Multibanco reference. Please try again.');
  }
};

/**
 * Validate Promo Code
 * @param {string} code - Promo code to validate
 * @returns {Promise<Object>} Promo code details if valid
 */
export const validatePromoCode = async (code) => {
  try {
    const { db } = await import('../config/firebase');
    const { collection, query, where, getDocs, limit } = await import('firebase/firestore');

    const promoQuery = query(
      collection(db, 'promoCodes'),
      where('code', '==', code.toUpperCase()),
      where('active', '==', true),
      limit(1)
    );

    const snapshot = await getDocs(promoQuery);

    if (snapshot.empty) {
      return {
        valid: false,
        error: 'Invalid promo code'
      };
    }

    const promo = snapshot.docs[0].data();
    const now = new Date();
    const validFrom = promo.validFrom?.toDate();
    const validUntil = promo.validUntil?.toDate();

    // Check date validity
    if (validFrom && validFrom > now) {
      return {
        valid: false,
        error: 'Promo code not yet active'
      };
    }

    if (validUntil && validUntil < now) {
      return {
        valid: false,
        error: 'Promo code has expired'
      };
    }

    // Check usage limit
    if (promo.maxUses && promo.currentUses >= promo.maxUses) {
      return {
        valid: false,
        error: 'Promo code has reached maximum usage'
      };
    }

    return {
      valid: true,
      code: promo.code,
      type: promo.type,
      value: promo.value,
      description: promo.description
    };
  } catch (error) {
    console.error('Error validating promo code:', error);
    return {
      valid: false,
      error: 'Failed to validate promo code'
    };
  }
};

/**
 * Calculate discounted price
 * @param {number} originalPrice - Original price
 * @param {Object} promoCode - Promo code object
 * @returns {Object} Discount details
 */
export const calculateDiscount = (originalPrice, promoCode) => {
  if (!promoCode || !promoCode.valid) {
    return {
      originalPrice,
      discount: 0,
      finalPrice: originalPrice
    };
  }

  let discount = 0;

  if (promoCode.type === 'percentage') {
    discount = (originalPrice * promoCode.value) / 100;
  } else if (promoCode.type === 'fixed_amount') {
    discount = promoCode.value;
  }

  const finalPrice = Math.max(0, originalPrice - discount);

  return {
    originalPrice,
    discount,
    finalPrice,
    discountPercentage: promoCode.type === 'percentage' ? promoCode.value : Math.round((discount / originalPrice) * 100)
  };
};

/**
 * Format Multibanco reference for display
 * @param {string} reference - Raw reference number
 * @returns {string} Formatted reference (XXX XXX XXX)
 */
export const formatMultibancoReference = (reference) => {
  if (!reference) return '';
  const cleaned = reference.replace(/\s/g, '');
  return cleaned.match(/.{1,3}/g)?.join(' ') || cleaned;
};

/**
 * Format phone number for MB WAY
 * @param {string} phone - Phone number
 * @returns {string} Formatted phone number (9 digits)
 */
export const formatPhoneForMbWay = (phone) => {
  if (!phone) return '';
  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, '');
  // Take last 9 digits (Portuguese mobile numbers)
  return cleaned.slice(-9);
};

/**
 * Validate phone number for MB WAY
 * @param {string} phone - Phone number to validate
 * @returns {boolean} True if valid
 */
export const isValidMbWayPhone = (phone) => {
  const formatted = formatPhoneForMbWay(phone);
  // Portuguese mobile numbers start with 9 and have 9 digits total
  return /^9\d{8}$/.test(formatted);
};
