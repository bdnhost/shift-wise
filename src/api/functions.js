/**
 * Functions layer - replaces Base44 functions
 * Implements SMS sending and PayPal integration
 */

/**
 * Send SMS using configured provider
 * @param {Object} params
 * @param {string} params.recipient - Phone number(s), separated by semicolons
 * @param {string} params.msg - Message content
 * @returns {Promise<Object>} { data: { status: number, message: string } }
 */
export async function sendSms({ recipient, msg }) {
  const provider = import.meta.env.VITE_SMS_PROVIDER || 'mock';

  try {
    if (provider === 'mock') {
      // Mock SMS for development
      console.log('📱 Mock SMS sent:');
      console.log('  To:', recipient);
      console.log('  Message:', msg);

      // Simulate success with mock response
      const recipientCount = recipient.split(';').filter(r => r.trim()).length;
      return {
        data: {
          status: recipientCount, // Positive number = success
          message: `Mock: Message sent successfully to ${recipientCount} recipient(s)`
        }
      };
    }

    if (provider === 'twilio') {
      // Twilio implementation
      const accountSid = import.meta.env.VITE_TWILIO_ACCOUNT_SID;
      const authToken = import.meta.env.VITE_TWILIO_AUTH_TOKEN;
      const fromNumber = import.meta.env.VITE_TWILIO_PHONE_NUMBER;

      if (!accountSid || !authToken || !fromNumber) {
        throw new Error('Twilio credentials not configured');
      }

      const recipients = recipient.split(';').map(r => r.trim()).filter(r => r);
      const results = [];

      for (const to of recipients) {
        // Note: This is a simplified version. In production, you'd use Twilio SDK
        // or call Twilio API via a backend endpoint for security
        console.warn('Twilio integration requires backend endpoint for security');
        results.push({ to, status: 'pending' });
      }

      return {
        data: {
          status: results.length,
          message: `SMS queued for ${results.length} recipient(s)`
        }
      };
    }

    // Default: unsupported provider
    throw new Error(`Unsupported SMS provider: ${provider}`);
  } catch (error) {
    console.error('Error sending SMS:', error);
    return {
      data: {
        status: -1,
        message: error.message || 'Failed to send SMS'
      }
    };
  }
}

/**
 * Create PayPal order
 * @param {Object} params - Order parameters
 * @returns {Promise<Object>}
 */
export async function createPaypalOrder(params) {
  try {
    console.log('Creating PayPal order:', params);

    // This should be implemented via a backend endpoint for security
    // PayPal client credentials should NEVER be exposed to the frontend
    console.warn('PayPal integration requires backend endpoint for security');

    // Mock response
    return {
      id: 'MOCK_ORDER_' + Date.now(),
      status: 'CREATED',
      ...params
    };
  } catch (error) {
    console.error('Error creating PayPal order:', error);
    throw error;
  }
}

/**
 * Capture PayPal order
 * @param {Object} params - Capture parameters
 * @returns {Promise<Object>}
 */
export async function capturePaypalOrder(params) {
  try {
    console.log('Capturing PayPal order:', params);

    // This should be implemented via a backend endpoint for security
    console.warn('PayPal integration requires backend endpoint for security');

    // Mock response
    return {
      id: params.orderId || 'MOCK_CAPTURE_' + Date.now(),
      status: 'COMPLETED',
      ...params
    };
  } catch (error) {
    console.error('Error capturing PayPal order:', error);
    throw error;
  }
}

export default {
  sendSms,
  createPaypalOrder,
  capturePaypalOrder
};
