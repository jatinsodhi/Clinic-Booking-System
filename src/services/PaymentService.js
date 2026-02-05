const Logger = require('../core/Logger');
const eventBus = require('../core/EventBus');

class PaymentService {
    constructor() {
        this.logger = new Logger('PaymentService');
        // Simple flag to force failure for testing purposes
        this.shouldFailNext = false;

        this.initializeListeners();
    }

    initializeListeners() {
        eventBus.subscribe('DISCOUNT_APPLIED', this.processPayment.bind(this));

        // Listen for test control events
        eventBus.subscribe('TEST_FORCE_PAYMENT_FAIL', () => {
            this.shouldFailNext = true;
            this.logger.warn('TEST MODE: Next payment will fail.');
        });
    }

    async processPayment(payload) {
        const { bookingId, finalPrice, user } = payload;
        this.logger.info(`Processing payment...`, { bookingId, amount: finalPrice });

        // Simulate processing time
        setTimeout(() => {
            if (this.shouldFailNext) {
                this.logger.error(`Payment Gateway Error`, { bookingId });
                eventBus.publish('PAYMENT_FAILED', {
                    bookingId,
                    reason: 'Payment Logic Simulated Failure',
                    user // Pass context back for compensation
                });
                this.shouldFailNext = false; // Reset
            } else {
                this.logger.success(`Payment Verified.`, { bookingId, amount: finalPrice });
                eventBus.publish('PAYMENT_SUCCESS', {
                    bookingId,
                    finalPrice,
                    transactionId: 'TXN_' + Math.floor(Math.random() * 100000)
                });
            }
        }, 800);
    }
}

module.exports = PaymentService;
