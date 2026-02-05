const Logger = require('../core/Logger');
const eventBus = require('../core/EventBus');

class NotificationService {
    constructor() {
        this.logger = new Logger('NotificationService');
        this.initializeListeners();
    }

    initializeListeners() {
        eventBus.subscribe('BOOKING_CONFIRMED', this.sendConfirmation.bind(this));
        eventBus.subscribe('BOOKING_FAILED', this.sendFailureNotice.bind(this));
    }

    async sendConfirmation(payload) {
        const { bookingId, finalPrice } = payload;
        this.logger.success(`📧 Sending Email Confirmation to User`, { bookingId });
        // In real world: Send SendGrid/SES email
        eventBus.publish('NOTIFICATION_SENT', { bookingId, type: 'CONFIRMATION' });
    }

    async sendFailureNotice(payload) {
        const { bookingId, reason } = payload;
        this.logger.info(`📧 Sending Failure Notification to User`, { bookingId, reason });
        eventBus.publish('NOTIFICATION_SENT', { bookingId, type: 'FAILURE_NOTICE' });
    }
}

module.exports = NotificationService;
