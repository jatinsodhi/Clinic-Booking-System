const Logger = require('../core/Logger');
const eventBus = require('../core/EventBus');
const { v4: uuidv4 } = require('uuid');

class BookingService {
    constructor() {
        this.logger = new Logger('BookingService');
        // bookingId -> { status, details, error }
        this.bookings = new Map();

        this.initializeListeners();
    }

    initializeListeners() {
        // Step 1: Booking Initiated (Already handled by createBooking) - Inventory listens
        // Step 2: Inventory Reserved - Discount listens
        // Step 3: Discount Applied (or Skipped) - Payment listens
        // Step 4: Payment Success - Booking Finalizes

        eventBus.subscribe('PAYMENT_SUCCESS', this.handleBookingSuccess.bind(this));

        // Failures
        eventBus.subscribe('INVENTORY_FAILED', this.handleBookingFailed.bind(this));

        // Discount Rejection is unique: it triggers immediate Inventory Compensation
        eventBus.subscribe('DISCOUNT_REJECTED', this.handleDiscountRejected.bind(this));

        // Payment Failure is Complex: Needs to Compensate Discount AND Inventory
        eventBus.subscribe('PAYMENT_FAILED', this.handlePaymentFailed.bind(this));
    }

    createBooking(user, serviceIds) {
        const bookingId = uuidv4();

        this.bookings.set(bookingId, {
            status: 'PENDING',
            user,
            serviceIds,
            createdAt: new Date()
        });

        this.logger.info(`Initiating booking transaction`, { bookingId, user: user.name });

        eventBus.publish('BOOKING_INITIATED', {
            bookingId,
            user,
            serviceIds
        });

        return bookingId;
    }

    async handleBookingSuccess(payload) {
        const { bookingId, finalPrice, transactionId } = payload;

        if (this.bookings.has(bookingId)) {
            const booking = this.bookings.get(bookingId);
            booking.status = 'CONFIRMED';
            booking.finalPrice = finalPrice;
            booking.transactionId = transactionId;
            this.bookings.set(bookingId, booking);

            this.logger.success(`Transaction Completed Successfully`, { bookingId, finalPrice, transactionId });

            // Notify outside world (e.g. CLI)
            eventBus.publish('BOOKING_CONFIRMED', {
                bookingId,
                status: 'CONFIRMED',
                finalPrice,
                referenceId: bookingId
            });
        }
    }

    async handleDiscountRejected(payload) {
        const { bookingId, reason } = payload;
        this.logger.error(`Transaction Failed at Discount Stage`, { bookingId, reason });

        // Trigger Compensation in Inventory
        eventBus.publish('COMPENSATE_INVENTORY', { bookingId, reason });

        this.finalizeFailure(bookingId, reason);
    }

    async handlePaymentFailed(payload) {
        const { bookingId, reason } = payload;
        this.logger.error(`Transaction Failed at Payment Stage`, { bookingId, reason });

        // MULTI-STEP COMPENSATION
        // 1. Rollback Quota (if any was used)
        eventBus.publish('COMPENSATE_DISCOUNT', { bookingId, reason });

        // 2. Release Inventory
        eventBus.publish('COMPENSATE_INVENTORY', { bookingId, reason });

        this.finalizeFailure(bookingId, reason);
    }

    async handleBookingFailed(payload) {
        const { bookingId, reason } = payload;
        this.logger.error(`Transaction Failed at Inventory Stage`, { bookingId, reason });
        this.finalizeFailure(bookingId, reason);
    }

    finalizeFailure(bookingId, reason) {
        if (this.bookings.has(bookingId)) {
            const booking = this.bookings.get(bookingId);
            booking.status = 'FAILED';
            booking.reason = reason;
            this.bookings.set(bookingId, booking);

            eventBus.publish('BOOKING_FAILED', {
                bookingId,
                status: 'FAILED',
                reason
            });
        }
    }
}

module.exports = BookingService;
