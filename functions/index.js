const {onCall, HttpsError} = require('firebase-functions/v2/https');
const {onRequest} = require('firebase-functions/v2/https');
const {defineString} = require('firebase-functions/params');
const admin = require('firebase-admin');
const axios = require('axios');
const crypto = require('crypto');

admin.initializeApp();

// Eupago API configuration using environment variables
const EUPAGO_API_KEY = defineString('EUPAGO_API_KEY');
const EUPAGO_WEBHOOK_SECRET = defineString('EUPAGO_WEBHOOK_SECRET');

/**
 * Create MB WAY Payment
 * Creates a payment request via euPago MB WAY
 */
exports.createMbWayPayment = onCall(async (request) => {
  try {
    // Verify authentication
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'User must be authenticated');
    }

    const data = request.data;

    const { amount, phoneNumber, planId, userId, companyId, promoCode } = data;

    // Validate required fields
    if (!amount || !phoneNumber || !planId || !userId) {
      throw new HttpsError('invalid-argument', 'Missing required fields');
    }

    // Get user data
    const userDoc = await admin.firestore().collection('users').doc(userId).get();
    if (!userDoc.exists) {
      throw new HttpsError('not-found', 'User not found');
    }

    const userData = userDoc.data();

    // Apply promo code discount if provided
    let finalAmount = amount;
    let discountApplied = null;

    if (promoCode) {
      const promoDoc = await admin.firestore()
        .collection('promoCodes')
        .where('code', '==', promoCode)
        .where('active', '==', true)
        .limit(1)
        .get();

      if (!promoDoc.empty) {
        const promo = promoDoc.docs[0].data();
        const now = new Date();
        const validFrom = promo.validFrom?.toDate();
        const validUntil = promo.validUntil?.toDate();

        // Check if promo is valid
        if ((!validFrom || validFrom <= now) && (!validUntil || validUntil >= now)) {
          if (promo.type === 'percentage') {
            const discount = (amount * promo.value) / 100;
            finalAmount = amount - discount;
            discountApplied = {
              code: promoCode,
              type: 'percentage',
              value: promo.value,
              discount: discount
            };
          } else if (promo.type === 'fixed_amount') {
            finalAmount = Math.max(0, amount - promo.value);
            discountApplied = {
              code: promoCode,
              type: 'fixed_amount',
              value: promo.value,
              discount: promo.value
            };
          }
        }
      }
    }

    // Create payment reference in Firestore
    const paymentRef = await admin.firestore().collection('payments').add({
      userId,
      companyId: companyId || null,
      planId,
      amount: finalAmount,
      originalAmount: amount,
      discountApplied,
      method: 'mbway',
      phoneNumber,
      status: 'pending',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      clientName: userData.name || userData.email,
      plan: planId
    });

    // Call euPago API to create MB WAY payment
    const eupagoResponse = await axios.post(
      'https://clientes.eupago.pt/api/v1.02/mbway/create',
      {
        chave: EUPAGO_API_KEY.value(),
        valor: finalAmount.toFixed(2),
        id: paymentRef.id,
        alias: phoneNumber,
        descricao: `AllInStock - ${planId} Plan`
      }
    );

    if (eupagoResponse.data.estado === 'ok') {
      // Update payment with euPago reference
      await paymentRef.update({
        eupagoReference: eupagoResponse.data.referencia,
        eupagoId: eupagoResponse.data.id,
        eupagoData: eupagoResponse.data
      });

      return {
        success: true,
        paymentId: paymentRef.id,
        reference: eupagoResponse.data.referencia,
        amount: finalAmount,
        discountApplied
      };
    } else {
      // Payment creation failed
      await paymentRef.update({
        status: 'failed',
        error: eupagoResponse.data.mensagem || 'Payment creation failed'
      });

      throw new HttpsError('internal', eupagoResponse.data.mensagem || 'Payment creation failed');
    }
  } catch (error) {
    console.error('Error creating MB WAY payment:', error);
    throw new HttpsError('internal', error.message || 'Failed to create payment');
  }
});

/**
 * Create Multibanco Payment Reference
 * Generates a Multibanco reference via euPago
 */
exports.createMultibancoPayment = onCall(async (request) => {
  try {
    // Verify authentication
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'User must be authenticated');
    }

    const data = request.data;
    const { amount, planId, userId, companyId, promoCode } = data;

    // Validate required fields
    if (!amount || !planId || !userId) {
      throw new HttpsError('invalid-argument', 'Missing required fields');
    }

    // Get user data
    const userDoc = await admin.firestore().collection('users').doc(userId).get();
    if (!userDoc.exists) {
      throw new HttpsError('not-found', 'User not found');
    }

    const userData = userDoc.data();

    // Apply promo code discount if provided
    let finalAmount = amount;
    let discountApplied = null;

    if (promoCode) {
      const promoDoc = await admin.firestore()
        .collection('promoCodes')
        .where('code', '==', promoCode)
        .where('active', '==', true)
        .limit(1)
        .get();

      if (!promoDoc.empty) {
        const promo = promoDoc.docs[0].data();
        const now = new Date();
        const validFrom = promo.validFrom?.toDate();
        const validUntil = promo.validUntil?.toDate();

        // Check if promo is valid
        if ((!validFrom || validFrom <= now) && (!validUntil || validUntil >= now)) {
          if (promo.type === 'percentage') {
            const discount = (amount * promo.value) / 100;
            finalAmount = amount - discount;
            discountApplied = {
              code: promoCode,
              type: 'percentage',
              value: promo.value,
              discount: discount
            };
          } else if (promo.type === 'fixed_amount') {
            finalAmount = Math.max(0, amount - promo.value);
            discountApplied = {
              code: promoCode,
              type: 'fixed_amount',
              value: promo.value,
              discount: promo.value
            };
          }
        }
      }
    }

    // Create payment reference in Firestore
    const paymentRef = await admin.firestore().collection('payments').add({
      userId,
      companyId: companyId || null,
      planId,
      amount: finalAmount,
      originalAmount: amount,
      discountApplied,
      method: 'multibanco',
      status: 'pending',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      clientName: userData.name || userData.email,
      plan: planId
    });

    // Call euPago API to create Multibanco reference
    const eupagoResponse = await axios.post(
      'https://clientes.eupago.pt/api/v1.02/multibanco/create',
      {
        chave: EUPAGO_API_KEY.value(),
        valor: finalAmount.toFixed(2),
        id: paymentRef.id,
        descricao: `AllInStock - ${planId} Plan`
      }
    );

    if (eupagoResponse.data.estado === 'ok') {
      // Update payment with euPago reference
      await paymentRef.update({
        eupagoReference: eupagoResponse.data.referencia,
        eupagoEntity: eupagoResponse.data.entidade,
        eupagoId: eupagoResponse.data.id,
        eupagoData: eupagoResponse.data
      });

      return {
        success: true,
        paymentId: paymentRef.id,
        entity: eupagoResponse.data.entidade,
        reference: eupagoResponse.data.referencia,
        amount: finalAmount,
        discountApplied
      };
    } else {
      // Payment creation failed
      await paymentRef.update({
        status: 'failed',
        error: eupagoResponse.data.mensagem || 'Payment creation failed'
      });

      throw new HttpsError('internal', eupagoResponse.data.mensagem || 'Payment creation failed');
    }
  } catch (error) {
    console.error('Error creating Multibanco payment:', error);
    throw new HttpsError('internal', error.message || 'Failed to create payment');
  }
});

/**
 * Eupago Webhook Handler
 * Processes payment notifications from euPago
 */
exports.eupagoWebhook = onRequest(async (req, res) => {
  try {
    // Verify webhook signature
    const signature = req.headers['x-eupago-signature'];
    const body = JSON.stringify(req.body);

    const expectedSignature = crypto
      .createHmac('sha256', EUPAGO_WEBHOOK_SECRET.value())
      .update(body)
      .digest('hex');

    if (signature !== expectedSignature) {
      console.error('Invalid webhook signature');
      return res.status(401).send('Invalid signature');
    }

    const { id, estado, referencia, valor, method } = req.body;

    // Find payment by euPago ID or reference
    const paymentsRef = admin.firestore().collection('payments');
    const snapshot = await paymentsRef.where('eupagoId', '==', id).limit(1).get();

    if (snapshot.empty) {
      console.error('Payment not found for euPago ID:', id);
      return res.status(404).send('Payment not found');
    }

    const paymentDoc = snapshot.docs[0];
    const payment = paymentDoc.data();

    // Update payment status based on euPago status
    let newStatus = 'pending';
    if (estado === 'ok' || estado === 'success' || estado === 'paid') {
      newStatus = 'paid';
    } else if (estado === 'failed' || estado === 'error') {
      newStatus = 'failed';
    }

    await paymentDoc.ref.update({
      status: newStatus,
      paidAt: newStatus === 'paid' ? admin.firestore.FieldValue.serverTimestamp() : null,
      eupagoWebhookData: req.body,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // If payment succeeded, activate subscription
    if (newStatus === 'paid') {
      const { userId, companyId, planId } = payment;

      // Update user's company subscription
      if (companyId) {
        await admin.firestore().collection('companies').doc(companyId).update({
          subscriptionPlan: planId,
          subscriptionStatus: 'active',
          subscriptionStartDate: admin.firestore.FieldValue.serverTimestamp(),
          lastPaymentDate: admin.firestore.FieldValue.serverTimestamp(),
          lastPaymentAmount: payment.amount,
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
      } else {
        // Create new company for user
        const companyRef = await admin.firestore().collection('companies').add({
          ownerId: userId,
          subscriptionPlan: planId,
          subscriptionStatus: 'active',
          subscriptionStartDate: admin.firestore.FieldValue.serverTimestamp(),
          lastPaymentDate: admin.firestore.FieldValue.serverTimestamp(),
          lastPaymentAmount: payment.amount,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });

        // Update user with company reference
        await admin.firestore().collection('users').doc(userId).update({
          companyId: companyRef.id,
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });

        // Update payment with company ID
        await paymentDoc.ref.update({
          companyId: companyRef.id
        });
      }

      console.log('Payment processed successfully:', paymentDoc.id);
    }

    return res.status(200).send('Webhook processed');
  } catch (error) {
    console.error('Error processing webhook:', error);
    return res.status(500).send('Internal server error');
  }
});
